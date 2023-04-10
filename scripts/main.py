import os

from modules import script_callbacks
from newtype_v3.tabs import feed
import shutil


script_callbacks.on_ui_tabs(feed.on_ui_tabs)


is_exists = os.path.exists('/content/repository/extensions-builtin')
if is_exists:
    shutil.copytree('extensions/sd_feed/javascript', 'extensions-builtin/prompt-bracket-checker/javascript', dirs_exist_ok=True)