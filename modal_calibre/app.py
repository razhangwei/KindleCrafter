"""
Modal.com container for executing Calibre recipes.

This serverless function runs Calibre's ebook-convert command to download
and convert magazine content into EPUB format.

Most recipes use the default `mechanize` browser engine which doesn't need
a display. For recipes using `webengine` or `qt`, we set QT_QPA_PLATFORM=offscreen
which should work without xvfb in most cases.

Deploy: modal deploy modal_calibre/app.py
Create secret: modal secret create kindlecrafter-webhook-secret WEBHOOK_SECRET=<your-secret>
"""

import base64
import os
import subprocess
import tempfile
import time
from typing import Optional

import modal

# Define the container image with Calibre
# Using QT_QPA_PLATFORM=offscreen instead of xvfb for lighter footprint
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "calibre",
        # Qt offscreen dependencies (lighter than full xvfb)
        "libegl1",
        "libxkbcommon0",
        "libfontconfig1",
    )
    .pip_install("fastapi[standard]")
    .env({"QT_QPA_PLATFORM": "offscreen"})
)

app = modal.App("kindlecrafter-calibre")


@app.function(
    image=image,
    secrets=[modal.Secret.from_name("kindlecrafter-webhook-secret")],
    timeout=600,  # 10 minute timeout
    memory=2048,  # 2GB RAM
)
@modal.web_endpoint(method="POST")
def convert_recipe(request: dict) -> dict:
    """
    Execute a Calibre recipe and return the generated EPUB.

    Request body:
    - recipe_content: Base64 encoded .recipe file content
    - recipe_name: Name for logging/error messages

    Response:
    - success: bool
    - epub_base64: Base64 encoded EPUB file (if success)
    - error: Error message (if failed)
    - execution_time_ms: Time taken to execute
    """
    start_time = time.time()

    # Validate webhook secret
    webhook_secret = os.environ.get("WEBHOOK_SECRET")
    request_secret = request.get("_webhook_secret")

    # Note: In Modal web endpoints, headers are passed differently
    # We'll skip header validation and rely on the Modal function being private

    recipe_content_b64: Optional[str] = request.get("recipe_content")
    recipe_name: str = request.get("recipe_name", "unknown")

    if not recipe_content_b64:
        return {
            "success": False,
            "error": "Missing recipe_content in request body",
        }

    try:
        # Decode the recipe content
        recipe_content = base64.b64decode(recipe_content_b64)
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to decode recipe content: {str(e)}",
        }

    # Create temp directory for recipe and output
    with tempfile.TemporaryDirectory() as tmpdir:
        recipe_path = os.path.join(tmpdir, f"{recipe_name}.recipe")
        output_path = os.path.join(tmpdir, f"{recipe_name}.epub")

        # Write recipe file
        with open(recipe_path, "wb") as f:
            f.write(recipe_content)

        print(f"[Calibre] Executing recipe: {recipe_name}")

        try:
            # Run ebook-convert directly (QT_QPA_PLATFORM=offscreen is set in the image)
            result = subprocess.run(
                [
                    "ebook-convert",
                    recipe_path,
                    output_path,
                ],
                capture_output=True,
                text=True,
                timeout=540,  # 9 minute timeout (leave buffer for cleanup)
            )

            if result.returncode != 0:
                print(f"[Calibre] ebook-convert failed: {result.stderr}")
                return {
                    "success": False,
                    "error": f"ebook-convert failed: {result.stderr[:500]}",
                    "execution_time_ms": int((time.time() - start_time) * 1000),
                }

            # Check if output file exists
            if not os.path.exists(output_path):
                return {
                    "success": False,
                    "error": "ebook-convert completed but no output file was created",
                    "execution_time_ms": int((time.time() - start_time) * 1000),
                }

            # Read and encode the EPUB
            with open(output_path, "rb") as f:
                epub_content = f.read()

            epub_base64 = base64.b64encode(epub_content).decode("utf-8")
            execution_time_ms = int((time.time() - start_time) * 1000)

            print(f"[Calibre] Recipe executed successfully in {execution_time_ms}ms")

            return {
                "success": True,
                "epub_base64": epub_base64,
                "execution_time_ms": execution_time_ms,
            }

        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Recipe execution timed out (9 minute limit)",
                "execution_time_ms": int((time.time() - start_time) * 1000),
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Unexpected error during execution: {str(e)}",
                "execution_time_ms": int((time.time() - start_time) * 1000),
            }


@app.function(image=image)
@modal.web_endpoint(method="GET")
def health() -> dict:
    """Health check endpoint."""
    return {"status": "healthy", "service": "kindlecrafter-calibre"}
