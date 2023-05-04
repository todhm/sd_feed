import re
import traceback
from typing import List, Dict
import requests
from newtype_v3.users import create_user_headers


def lora_string_list(prompt: str) -> List[str]:
    data_list = []
    for x in re.findall(r'\<lora\:.+?.\>', prompt):
        data_list.append(x.split(':')[1])
    return data_list


def search_lora_list(lora_list: List[str]) -> List[Dict]:
    try:
        headers, user_dict = create_user_headers()
        result_list = requests.post(
            'https://newtypev3-server-vjiloyvjvq-an.a.run.app/lora/loras',
            json={
                'loraList': lora_list,
                'userId': user_dict.get("userId")
            },
            headers=headers
        )
        result = result_list.json()
        if type(result) is list:
            return result
        raise ValueError(result)
    except Exception as e:
        print(e, traceback.format_exc())
        return False