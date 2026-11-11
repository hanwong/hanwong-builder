import sys
from PIL import Image, ImageDraw
S=sys.argv[1]
CREAM=(250,239,221); NAVY=(31,58,95); RED=(195,72,42)
src=Image.open(f"{S}/sume-pill-1.png").convert("RGB")
x0,x1,y0,y1=69,1464,191,752
h=y1-y0
def aa_mask(size, draw_fn, k=4):
    m=Image.new("L",(size[0]*k,size[1]*k),0); draw_fn(ImageDraw.Draw(m),k); return m.resize(size,Image.LANCZOS)
# --- clean pill on cream, with navy outer ring
NW=16  # navy ring width
pad=NW+40
cw,ch=(x1-x0)+2*pad,(y1-y0)+2*pad
out=Image.new("RGB",(cw,ch),CREAM)
ox,oy=x0-pad,y0-pad
def rr(d,k,ins,fill):
    d.rounded_rectangle([( x0-ox-ins)*k,(y0-oy-ins)*k,(x1-ox+ins)*k,(y1-oy+ins)*k],radius=(h/2+ins)*k,fill=fill)
navy=aa_mask((cw,ch),lambda d,k:(rr(d,k,NW,255),rr(d,k,0,0)))
out.paste(NAVY,(0,0),navy)
inner=aa_mask((cw,ch),lambda d,k:rr(d,k,-3,255))
crop=src.crop((ox,oy,ox+cw,oy+ch))
out.paste(crop,(0,0),inner)
out.save(f"{S}/pill-clean.png")
# transparent version
t=out.convert("RGBA"); full=aa_mask((cw,ch),lambda d,k:rr(d,k,NW,255)); t.putalpha(full)
t=t.crop((pad-NW-2,pad-NW-2,cw-pad+NW+2,ch-pad+NW+2)); t.save(f"{S}/pill-transparent.png")
# --- OG 1200x630
og=Image.new("RGB",(1200,630),CREAM)
pw=1000; ph=round(t.height*pw/t.width); p=t.resize((pw,ph),Image.LANCZOS)
og.paste(p,((1200-pw)//2,(630-ph)//2),p); og.save(f"{S}/og.png")
# --- round "Re" mark
from collections import deque
crop=src.crop((130,250,500,600)); cw2,ch2=crop.size; cp=crop.load()
RR,RG,RB=RED; CR,CG,CB=CREAM
al=[[0]*cw2 for _ in range(ch2)]
for yy in range(ch2):
    for xx in range(cw2):
        r,g,b=cp[xx,yy]
        t=(g-RG)/(CG-RG); al[yy][xx]=max(0.0,min(1.0,t))
# keep components that contain the biggest blobs (R and e)
seen=[[False]*cw2 for _ in range(ch2)]; comps=[]
for yy in range(ch2):
    for xx in range(cw2):
        if al[yy][xx]>0.15 and not seen[yy][xx]:
            q=deque([(xx,yy)]); seen[yy][xx]=True; pts=[]
            while q:
                a,b=q.popleft(); pts.append((a,b))
                for da,db in ((1,0),(-1,0),(0,1),(0,-1)):
                    na,nb=a+da,b+db
                    if 0<=na<cw2 and 0<=nb<ch2 and not seen[nb][na] and al[nb][na]>0.15:
                        seen[nb][na]=True; q.append((na,nb))
            comps.append(pts)
comps.sort(key=len,reverse=True)
for c in comps[:4]:
    xs=[p[0] for p in c]; ys=[p[1] for p in c]; print(len(c),min(xs),max(xs),min(ys),max(ys))
keep=set()
for c in comps:
    xs=[p[0] for p in c]; ys=[p[1] for p in c]
    if len(c)>2000 and min(xs)>3 and min(ys)>3 and max(ys)<ch2-4: keep.update(c)
from PIL import Image as I2
A=I2.new("L",(cw2,ch2),0); ap=A.load()
for (a,b) in keep: ap[a,b]=int(al[b][a]*255)
bb=A.getbbox(); A=A.crop(bb); print("glyph bbox",bb)
def mark(N, bg=None):
    k=4; M=N*k
    base=Image.new("RGBA",(M,M),bg+(255,) if bg else (0,0,0,0))
    d=ImageDraw.Draw(base)
    m=M*0.02 if bg is None else M*0.08
    r0=(M-2*m)/2; c=M/2
    d.ellipse([c-r0,c-r0,c+r0,c+r0],fill=NAVY+(255,))
    r1=r0*0.90; d.ellipse([c-r1,c-r1,c+r1,c+r1],fill=CREAM+(255,))
    r2=r0*0.82; d.ellipse([c-r2,c-r2,c+r2,c+r2],fill=RED+(255,))
    gw=int(r2*1.45); gh=round(A.height*gw/A.width)
    g=A.resize((gw,gh),Image.LANCZOS)
    base.paste(CREAM+(255,),(int(c-gw/2),int(c-gh/2)),g)
    return base.resize((N,N),Image.LANCZOS)
mark(512).save(f"{S}/icon512.png")
mark(180,CREAM).convert("RGB").save(f"{S}/apple180.png")
m=mark(256); m.save(f"{S}/favicon.ico",sizes=[(16,16),(32,32),(48,48),(64,64)])
prev=Image.new("RGB",(600,200),(245,240,227))
for i,s in enumerate([16,32,64,128]):
    im=mark(512).resize((s,s),Image.LANCZOS); prev.paste(im,(20+i*140,100-s//2),im)
prev.save(f"{S}/icon-sizes.png")
