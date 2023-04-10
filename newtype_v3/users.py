import json
import uuid
import requests
from newtype_v3.locs import DEFAULT_LOC

def create_user() -> str:
    try:
        with open(f'{DEFAULT_LOC}/user.json') as f:
            user_dict = json.load(f)
            return user_dict['userId']
    except Exception:
        userId = str(uuid.uuid4())
        user_dict = {
            'userId': userId,
        }
        with open(f'{DEFAULT_LOC}/user.json', 'w') as f:
            json.dump(user_dict, f, sort_keys=True, indent=4)
        _ = requests.post(
            'https://newtypev3-server-vjiloyvjvq-an.a.run.app/user/user', 
            json=user_dict
        )
        return userId