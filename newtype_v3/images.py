import json
import os
from typing import Dict, List, Optional
import re
import base64
from io import BytesIO
from tempfile import _TemporaryFileWrapper
import traceback

from modules.images import read_info_from_image
from newtype_v3.users import create_user
from newtype_v3.utils.string_utils import return_string_dict
from newtype_v3.locs import DEFAULT_LOC

from PIL import Image
from modules.processing import StableDiffusionProcessing
import requests


def dumper(obj):
    try:
        return obj.toJSON()
    except Exception:
        try:
            return obj.__dict__
        except Exception:
            return str(obj)
    

def create_image(img: Image, user_id: str, process: StableDiffusionProcessing, info: Optional[str] = None, token: str = ''):
    try:
        if info:
            data_dict = return_string_dict(info)
        else:
            applied_to_hires = (
                getattr(process, 'applied_old_hires_behavior_to')
                if hasattr(process, 'applied_old_hires_behavior_to')
                else None
            )
            enable_hr = (
                getattr(process, 'enable_hr')
                if hasattr(process, 'enable_hr')
                else None
            )
            
            data_dict = {
                'all_negative_prompts': process.all_negative_prompts, 
                'all_prompts': process.all_prompts,
                'all_seeds': process.all_seeds, 
                'all_subseeds': process.all_subseeds, 
                'applied_old_hires_behavior_to': applied_to_hires,
                'batch_size': process.batch_size, 
                'cfg_scale': process.cfg_scale, 
                'color_corrections': process.color_corrections,
                'ddim_discretize': process.ddim_discretize,
                'denoising_strength': process.denoising_strength,
                'disable_extra_networks': process.disable_extra_networks,
                'do_not_reload_embeddings': process.do_not_reload_embeddings, 
                'do_not_save_grid': process.do_not_save_grid, 
                'do_not_save_samples': process.do_not_save_samples,
                'enable_hr': enable_hr, 
                'eta': process.eta, 
                'extra_generation_params': process.extra_generation_params, 
                'height': process.height,
                'iteration': process.iteration, 
                'n_iter': process.n_iter, 
                'negative_prompt': process.negative_prompt, 
                'outpath_grids': process.outpath_grids,
                'outpath_samples': process.outpath_samples,
                'overlay_images': process.overlay_images,
                'override_settings': process.override_settings, 
                'override_settings_restore_afterwards': 
                process.override_settings_restore_afterwards, 
                'process': process.paste_to,
                'prompt': process.prompt, 
                'prompt_for_display': process.prompt_for_display, 
                'restore_faces': process.restore_faces, 
                's_churn': process.s_churn, 
                's_noise': process.s_noise, 
                's_tmax': process.s_tmax, 
                's_tmin': process.s_tmin,
                'sampler_name': process.sampler_name, 
                'sampler_noise_scheduler_override': 
                process.sampler_noise_scheduler_override,
                'script_args': process.script_args, 
                'scripts': [x.title() for x in process.scripts.scripts], 
                'sd_model': process.sd_model.sd_checkpoint_info.title,
                'seed': process.seed, 
                'seed_resize_from_h': process.seed_resize_from_h, 
                'seed_resize_from_w': process.seed_resize_from_w, 
                'steps': process.steps, 
                'styles': process.styles, 
                'subseed': process.subseed, 
                'subseed_strength': process.subseed_strength, 
            }
            for row in [
                'hr_resize_x',
                'hr_resize_y',
                'hr_scale',
                'hr_second_pass_steps',
                'hr_upscale_to_x',
                'hr_upscale_to_y',
                'hr_upscaler',
                'tiling',
                'truncate_x',
                'truncate_y',
                'width'
            ]:
                value = (
                    getattr(process, row)
                    if hasattr(process, row)
                    else None
                )
                data_dict[row] = value
        img.save(f'{DEFAULT_LOC}/temp.png', "PNG", optimize=True)
        img.seek(0)
        _ = requests.post(
            'https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/image',
            data={
                'userId': user_id,
                'metadata': json.dumps(data_dict, default=dumper)
            },
            files={
                'upload_file': open(f'{DEFAULT_LOC}/temp.png', 'rb')
            },
            stream=True,
            headers={
                'Authorization': f'Token {token}'
            }
        )
        os.remove(f'{DEFAULT_LOC}/temp.png')
    except Exception as e:
        print(e)
        pass


def create_image_from_string(img_string: str, user_id: str, token: str = ''):
    try:
        remove_image = False
        if img_string.startswith("http") or img_string.startswith("file="):
            file_loc = (
                re.search(r'file=(.*)', img_string).group(1)
                .replace("%20", ' ')
            )
            img = Image.open(file_loc)
            text_info, extra_items = read_info_from_image(img)
            data_dict = return_string_dict(text_info)
            data_dict.update(extra_items)
        else:
            file_loc = f'{DEFAULT_LOC}/temp.png'
            img_string = img_string.split(",")[1]
            img = Image.open(BytesIO(base64.b64decode(img_string)))
            img.save(file_loc, "PNG", optimize=True)
            img.seek(0)
            remove_image = True
            
        _ = requests.post(
            'https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/image',
            data={
                'userId': user_id,
                'metadata': json.dumps(data_dict, default=dumper)
            },
            files={
                'upload_file': open(file_loc, 'rb')
            },
            stream=True,
            headers={
                'Authorization': f'Token {token}'
            }
        )
        try:
            if remove_image:
                os.remove(file_loc)
        except Exception:
            pass
        return True
    except Exception as e:
        print(e, traceback.format_exc())
        return False


def create_image_to_image_file(
    img_string: str, original_img_string: str, user_id: str,
    token: str = ''
):
    try:
        remove_image = False
        if img_string.startswith("http") or img_string.startswith("file="):
            file_loc = (
                re.search(r'file=(.*)', img_string).group(1)
                .replace("%20", ' ')
            )
            img = Image.open(file_loc)
            text_info, extra_items = read_info_from_image(img)
            data_dict = return_string_dict(text_info)
            data_dict.update(extra_items)
        else:
            file_loc = f'{DEFAULT_LOC}/temp.png'
            img_string = img_string.split(",")[1]
            img = Image.open(BytesIO(base64.b64decode(img_string)))
            img.save(file_loc, "PNG", optimize=True)
            img.seek(0)
            remove_image = True
        origin_loc = f'{DEFAULT_LOC}/temp2.png'
        original_img_string = original_img_string.split(',')[1]
        img = Image.open(BytesIO(base64.b64decode(original_img_string)))
        img.save(origin_loc, "PNG", optimize=True)
        _ = requests.post(
            'https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/image',
            data={
                'userId': user_id,
                'metadata': json.dumps(data_dict, default=dumper)
            },
            files={
                'upload_file': open(file_loc, 'rb'),
                'img_to_img_file': open(origin_loc, 'rb')
            },
            stream=True,
            headers={
                'Authorization': f'Token {token}'
            }
        )
        try:
            if remove_image:
                os.remove(file_loc)
            os.remove(origin_loc)
        except Exception:
            pass
        return True
    except Exception as e:
        print('Image to image save error', e)
        return False


def create_image_from_img(img: Image, user_id: str, data_dict: Dict, token: str = ''):
    try:
        file_loc = f'{DEFAULT_LOC}/temp.png'
        img.save(file_loc, "PNG", optimize=True)
        img.seek(0)
        _ = requests.post(
            'https://newtypev3-server-vjiloyvjvq-an.a.run.app/image/image',
            data={
                'userId': user_id,
                'metadata': json.dumps(data_dict, default=dumper)
            },
            files={
                'upload_file': open(file_loc, 'rb')
            },
            stream=True,
            headers={
                'Authorization': f'Token {token}'
            }
        )
        os.remove(file_loc)
    except Exception as e:
        print(e)
        pass


def create_multiple_file_uploads(
    data: List[_TemporaryFileWrapper]
):
    user_dict = create_user()
    user_id = user_dict.get('userId')
    for d in data:
        try:
            image = Image.open(BytesIO(d))
            textinfo, items = read_info_from_image(image)
            if textinfo is not None:
                data = return_string_dict(textinfo)
                data.update(items)
            else:
                data = {}
            create_image_from_img(image, user_id, data)
        except Exception as e:
            print(e)
            pass
    return []

