#!/usr/bin/env python3
"""Сборка калькулятора: template.html + mk.json -> index.html и папка public/ для Vercel,
плюс архив исходников по неочевидному адресу, чтобы отдать их человеку без доступа к GitHub"""
import pathlib, json, shutil, zipfile

d = pathlib.Path(__file__).parent
tpl = (d / 'template.html').read_text(encoding='utf-8')
data = (d / 'mk.json').read_text(encoding='utf-8')
items = json.loads(data)  # битый JSON роняет сборку, сайт остаётся на прошлой версии

# Проверка прайса: у каждой позиции название и три цены (или null, если цены нет)
errors = []
for i, x in enumerate(items, 1):
    name = x.get('n')
    if not isinstance(name, str) or not name.strip():
        errors.append(f'позиция {i}: нет названия')
    c = x.get('c')
    if c is not None and not (isinstance(c, list) and len(c) == 3
                              and all(isinstance(v, (int, float)) and v >= 0 for v in c)):
        errors.append(f'позиция {i} «{name}»: цены должны быть списком из трёх чисел, сейчас {c!r}')
if errors:
    raise SystemExit('Ошибки в mk.json:\n' + '\n'.join(errors))

out = tpl.replace('/*__MK__*/[]', data)
assert '/*__MK__*/' not in out, 'плейсхолдер не заменился'
(d / 'index.html').write_text(out, encoding='utf-8')

pub = d / 'public'
shutil.rmtree(pub, ignore_errors=True)
pub.mkdir()
(pub / 'index.html').write_text(out, encoding='utf-8')
shutil.copytree(d / 'img', pub / 'img')

SOURCES = ['README.md', 'build.py', 'mk.json', 'template.html', 'test-formulas.mjs',
           'package.json', 'vercel.json', '.gitignore', 'img/logo.png']
zdir = pub / 'iskhodniki-0ehhgf1yrh'
zdir.mkdir()
with zipfile.ZipFile(zdir / 'kalkulyator-mk.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for f in SOURCES:
        z.write(d / f, 'kalkulyator-mk/' + f)
print('index.html собран:', round(len(out.encode('utf-8')) / 1024, 1), 'КБ, позиций:', len(items))
