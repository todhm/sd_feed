import os
from modules import script_callbacks
from newtype_v3.tabs import feed
from newtype_v3.locs import is_exists, is_exists_seconds
import shutil


script_callbacks.on_ui_tabs(feed.on_ui_tabs)


if is_exists and is_exists_seconds:
    shutil.copytree(
        '/content/drive/MyDrive/SD/extensions/sd_feed/javascript', 
        '/content/repository/extensions-builtin/prompt-bracket-checker/javascript', 
        dirs_exist_ok=True
    )
    if not os.path.exists('/content/repository/extensions-builtin/LDSR/style.css'):
        shutil.copy(
            '/content/drive/MyDrive/SD/extensions/sd_feed/style.css', 
            '/content/repository/extensions-builtin/LDSR/style.css'
        )