import os

from modules import script_callbacks
from newtype_v3.tabs import feed
import shutil


script_callbacks.on_ui_tabs(feed.on_ui_tabs)


is_exists = os.path.exists('/content/repository/extensions-builtin')
is_exists_seconds = os.path.exists('/content/drive/MyDrive/SD/extensions/sd_feed/javascript')
if is_exists and is_exists_seconds:
    shutil.copytree(
        '/content/drive/MyDrive/SD/extensions/sd_feed/javascript', 
        '/content/repository/extensions-builtin/prompt-bracket-checker/javascript', 
        dirs_exist_ok=True
    )