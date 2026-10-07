"""Lay out actual QA renderer captures for a reviewable cast design sheet."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).resolve().parent.parent
out=Image.new('RGB',(1440,1160),'#f5f2e9');d=ImageDraw.Draw(out)
heading=ImageFont.truetype(str(root/'dist/font-0.ttf'),54)
name=ImageFont.truetype(str(root/'dist/font-0.ttf'),34)
small=ImageFont.truetype(str(root/'dist/font-4.ttf'),17)
d.text((48,29),'THE PEOPLE OF LITTLE LIBERTY',font=heading,fill='#303c32')
d.text((50,96),'Original in-game cast  /  carved forms, individual silhouettes, articulated expressions',font=small,fill='#7b806e')
cast=[('pat','Pat','OFFICE WORKER'),('morgan','Morgan','LIBRARIAN'),('dee','Dee','POSTAL WORKER'),('sam','Sam','NURSE'),('casey','Casey','NEIGHBOR'),('auditor','The auditor','SELF-APPOINTED MAIN CHARACTER')]
for i,(key,label,role) in enumerate(cast):
 x=48+(i%3)*456;y=148+(i//3)*487
 im=Image.open(root/f'character-{key}.png').convert('RGB');im.thumbnail((426,388))
 out.paste(im,(x+(426-im.width)//2,y))
 d.text((x,y+397),label,font=name,fill='#303c32')
 d.text((x,y+439),role,font=small,fill='#7b806e')
d.text((48,1120),'1ST AMENDMENT AUDITOR  /  v0.4  /  Models shown directly from the game’s character viewer.',font=small,fill='#7b806e')
out.save(root/'cast-lineup.png')
