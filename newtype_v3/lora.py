import re
import traceback
from typing import List, Dict
import requests


def lora_string_list(prompt: str) -> List[str]:
    data_list = []
    for x in re.findall(r'\<lora\:.+?.\>', prompt):
        data_list.append(x.split(':')[1])
    return data_list


def search_lora_list(lora_string: str) -> List[Dict]:
    try:
        if type(lora_string) is not str:
            lora_string = lora_string[0]
        lora_list = lora_string_list(lora_string)
        result_list = requests.post(
            'https://newtypev3-server-vjiloyvjvq-an.a.run.app/lora/loras',
            json={
                'loraList': lora_list,
            },
        )
        result = result_list.json()
        if type(result) is list:
            return result
        raise ValueError(result)
    except Exception as e:
        print(e, traceback.format_exc())
        return False