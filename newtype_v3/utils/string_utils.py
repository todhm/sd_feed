import re
from typing import Optional, Dict
from copy import deepcopy
from PIL import Image
from modules.generation_parameters_copypaste import parse_generation_parameters


def return_file_loc(image_src: str) -> Image:
    if image_src.startswith("http") or image_src.startswith("file="):
        file_loc = (
            re.search(r'file=(.*)', image_src).group(1)
            .replace("%20", ' ')
        )
        return Image.open(file_loc)


def return_string_dict(image_src: str) -> Dict:
    try:
        original_data_dict = parse_generation_parameters(image_src)
        data_dict = deepcopy(original_data_dict)
        for key in original_data_dict.keys():
            if key.lower() == 'model':
                data_dict['sd_model'] = data_dict[key]
            if key.lower() == 'steps':
                data_dict['n_iter'] = data_dict[key]
            if key.lower() == 'negative prompt':
                data_dict['negative_prompt'] = data_dict[key]
            if key.lower() == 'negative prompt':
                data_dict['negative_prompt'] = data_dict[key]
            if key.lower() == 'cfg scale':
                data_dict['cfg_scale'] = data_dict[key]
            if key.lower() == 'seed':
                data_dict['seed'] = data_dict[key]
            if key.lower() == 'prompt':
                data_dict['prompt'] = data_dict[key]
            if key.lower() == 'sampler':
                data_dict['sampler'] = data_dict[key]
        return data_dict
    except Exception:
        return {}
