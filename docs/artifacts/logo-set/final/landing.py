import sys; from PIL import Image
from collections import deque
S,OUT=sys.argv[1],sys.argv[2]
def cutout(path):
    im=Image.open(path).convert("RGBA"); W,H=im.size; p=im.load()
    bg=p[2,2][:3]
    def near(c,t): return sum((a-b)**2 for a,b in zip(c[:3],bg))<t
    seen=bytearray(W*H); q=deque()
    for x in range(W): q+= [(x,0),(x,H-1)]
    for y in range(H): q+= [(0,y),(W-1,y)]
    while q:
        x,y=q.popleft(); i=y*W+x
        if seen[i] or not near(p[x,y],1600): continue
        seen[i]=1; p[x,y]=(0,0,0,0)
        for nx,ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
            if 0<=nx<W and 0<=ny<H and not seen[ny*W+nx]: q.append((nx,ny))
    # soften 1px fringe: pixels next to bg that are near-cream -> half alpha
    return im.crop(im.getbbox())
def place(im,W=750,H=735,fill=0.92,rot=0):
    im.thumbnail((int(W*fill),int(H*fill)),Image.LANCZOS)
    c=Image.new("RGBA",(W,H),(0,0,0,0)); c.paste(im,((W-im.width)//2,(H-im.height)//2),im); return c
for n,o in (("seal","circle"),("tap","star"),("repeat","repeat")):
    place(cutout(f"{S}/sume-{n}-1.png")).save(f"{OUT}/{o}.png",optimize=True)
place(Image.open(f"{S}/pill-transparent.png").convert("RGBA"),fill=0.96).save(f"{OUT}/pill.png",optimize=True)
