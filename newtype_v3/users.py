import json
from typing import Dict
import uuid
import requests
from newtype_v3.locs import DEFAULT_LOC

def create_user() -> Dict:
    try:
        with open(f'{DEFAULT_LOC}/user.json') as f:
            user_dict = json.load(f)
            user_id = user_dict.get('userId')
            if not user_dict.get("token"):
                post_dict = {
                    'userId': user_id,
                    'useAuth': True,
                }
                response = requests.post(
                    'https://newtypev3-server-vjiloyvjvq-an.a.run.app/user/user', 
                    json=post_dict
                )
                token = response.json().get('token')
                user_dict['token'] = token
                with open(f'{DEFAULT_LOC}/user.json', 'w') as f:
                    json.dump(user_dict, f, sort_keys=True, indent=4)
            return user_dict
    except Exception:
        userId = str(uuid.uuid4())
        user_dict = {
            'userId': userId,
            'useAuth': True,
        }
        response = requests.post(
            'https://newtypev3-server-vjiloyvjvq-an.a.run.app/user/user', 
            json=user_dict
        )
        token = response.json().get('token')
        print(token)
        user_dict['token'] = token
        with open(f'{DEFAULT_LOC}/user.json', 'w') as f:
            json.dump(user_dict, f, sort_keys=True, indent=4)
        return user_dict
