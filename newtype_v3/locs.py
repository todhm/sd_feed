import os


is_exists = os.path.exists('/content/repository/extensions-builtin')
is_exists_seconds = os.path.exists('/content/drive/MyDrive/SD/extensions/sd_feed/javascript')
SD_ROOT = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
if is_exists and is_exists_seconds:
    DEFAULT_LOC = '/content/drive/MyDrive/SD/extensions/sd_feed'
else:
    DEFAULT_LOC = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
