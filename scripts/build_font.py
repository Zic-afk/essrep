"""Build an original 5x7 pixel font. Python standard library only."""
import struct as s
from pathlib import Path
pack = s.pack
patterns = {
'A':'01110/10001/10001/11111/10001/10001/10001','B':'11110/10001/10001/11110/10001/10001/11110','C':'01111/10000/10000/10000/10000/10000/01111','D':'11110/10001/10001/10001/10001/10001/11110','E':'11111/10000/10000/11110/10000/10000/11111','F':'11111/10000/10000/11110/10000/10000/10000','G':'01111/10000/10000/10111/10001/10001/01111','H':'10001/10001/10001/11111/10001/10001/10001','I':'11111/00100/00100/00100/00100/00100/11111','J':'00111/00010/00010/00010/10010/10010/01100','K':'10001/10010/10100/11000/10100/10010/10001','L':'10000/10000/10000/10000/10000/10000/11111','M':'10001/11011/10101/10101/10001/10001/10001','N':'10001/11001/10101/10011/10001/10001/10001','O':'01110/10001/10001/10001/10001/10001/01110','P':'11110/10001/10001/11110/10000/10000/10000','Q':'01110/10001/10001/10001/10101/10010/01101','R':'11110/10001/10001/11110/10100/10010/10001','S':'01111/10000/10000/01110/00001/00001/11110','T':'11111/00100/00100/00100/00100/00100/00100','U':'10001/10001/10001/10001/10001/10001/01110','V':'10001/10001/10001/10001/10001/01010/00100','W':'10001/10001/10001/10101/10101/10101/01010','X':'10001/10001/01010/00100/01010/10001/10001','Y':'10001/10001/01010/00100/00100/00100/00100','Z':'11111/00001/00010/00100/01000/10000/11111',
'Б':'11111/10000/10000/11110/10001/10001/11110','Г':'11111/10000/10000/10000/10000/10000/10000','Д':'00110/01010/01010/01010/01010/11111/10001','Ж':'10101/10101/01110/00100/01110/10101/10101','З':'11110/00001/00001/01110/00001/00001/11110','И':'10001/10001/10011/10101/11001/10001/10001','Й':'01010/00100/10001/10011/10101/11001/10001','Л':'00111/01001/01001/01001/01001/10001/10001','П':'11111/10001/10001/10001/10001/10001/10001','У':'10001/10001/10001/01111/00001/00001/11110','Ф':'00100/01110/10101/10101/10101/01110/00100','Ц':'10010/10010/10010/10010/10010/11111/00001','Ч':'10001/10001/10001/01111/00001/00001/00001','Ш':'10101/10101/10101/10101/10101/10101/11111','Щ':'10101/10101/10101/10101/10101/11111/00001','Ъ':'11000/01000/01000/01110/01001/01001/01110','Ы':'10001/10001/10001/11101/10101/10101/11101','Ь':'10000/10000/10000/11110/10001/10001/11110','Э':'11110/00001/00001/01111/00001/00001/11110','Ю':'10110/11001/11001/11001/11001/11001/10110','Я':'01111/10001/10001/01111/00101/01001/10001','Ё':'01010/00000/11111/10000/11110/10000/11111',
'0':'01110/10001/10011/10101/11001/10001/01110','1':'00100/01100/00100/00100/00100/00100/01110','2':'01110/10001/00001/00010/00100/01000/11111','3':'11110/00001/00001/01110/00001/00001/11110','4':'00010/00110/01010/10010/11111/00010/00010','5':'11111/10000/10000/11110/00001/00001/11110','6':'01110/10000/10000/11110/10001/10001/01110','7':'11111/00001/00010/00100/01000/01000/01000','8':'01110/10001/10001/01110/10001/10001/01110','9':'01110/10001/10001/01111/00001/00001/01110',
'.':'00000/00000/00000/00000/00000/00100/00100',',':'00000/00000/00000/00000/00100/00100/01000',':':'00000/00100/00100/00000/00100/00100/00000','-':'00000/00000/00000/11111/00000/00000/00000','/':'00001/00010/00010/00100/01000/01000/10000','!':'00100/00100/00100/00100/00100/00000/00100','?':'01110/10001/00001/00010/00100/00000/00100','(':'00010/00100/01000/01000/01000/00100/00010',')':'01000/00100/00010/00010/00010/00100/01000','·':'00000/00000/00000/00100/00000/00000/00000','—':'00000/00000/00000/11111/00000/00000/00000','↗':'11111/00011/00101/01001/10001/00000/00000',' ':'00000/00000/00000/00000/00000/00000/00000'}
for a,b in zip('АВЕКМНОРСТХ','ABEKMHOPCTX'): patterns[a]=patterns[b]
for char,pattern in list(patterns.items()): patterns[char.lower()]=pattern
chars=sorted(patterns,key=ord)
glyphs=[b'']; metrics=[(600,0)]
for char in chars:
    points=[];ends=[]
    for y,row in enumerate(patterns[char].split('/')):
        for x,on in enumerate(row):
            if on=='1':
                left=x*100;bottom=(6-y)*100
                points.extend([(left,bottom),(left,bottom+100),(left+100,bottom+100),(left+100,bottom)])
                ends.append(len(points)-1)
    if not points: glyphs.append(b'');metrics.append((600,0));continue
    g=pack('>hhhhh',len(ends),0,0,500,700)+pack('>'+'H'*len(ends),*ends)+pack('>H',0)+bytes([1]*len(points))
    for axis in (0,1):
        previous=0
        for point in points:g+=pack('>h',point[axis]-previous);previous=point[axis]
    glyphs.append(g+b'\0'*((-len(g))%4));metrics.append((600,0))
offsets=[0]
for glyph in glyphs: offsets.append(offsets[-1]+len(glyph))
n=len(glyphs)
tables={}
tables['glyf']=b''.join(glyphs);tables['loca']=pack('>'+'I'*len(offsets),*offsets)
tables['head']=pack('>IIIIHHQQhhhhHHhhh',0x10000,0x10000,0,0x5F0F3CF5,3,1000,0,0,0,0,500,700,0,8,2,1,0)
tables['hhea']=pack('>IhhhHhhhhhhhhhhhH',0x10000,800,-200,0,600,0,100,500,1,0,0,0,0,0,0,0,n)
tables['maxp']=pack('>IH'+'H'*13,0x10000,n,140,35,0,0,2,0,0,0,0,0,0,0,0)
tables['hmtx']=b''.join(pack('>Hh',*m) for m in metrics)
codes=[ord(c) for c in chars]+[65535];count=len(codes)
seg=pack('>HHHHHHH',4,16+8*count,0,count*2,2*(2**(count.bit_length()-1)),count.bit_length()-1,2*count-2*(2**(count.bit_length()-1)))
seg+=pack('>'+'H'*count,*codes)+pack('>H',0)+pack('>'+'H'*count,*codes)
seg+=pack('>'+'H'*count,*([(i+1-ord(c))%65536 for i,c in enumerate(chars)]+[1]))+bytes(count*2)
tables['cmap']=pack('>HHHHI',0,1,3,1,12)+seg
names={1:'Orbit Pixel',2:'Regular',3:'OrbitPixel-Regular-1',4:'Orbit Pixel Regular',5:'Version 1.0',6:'OrbitPixel-Regular'}
records=b'';strings=b''
for key,value in names.items():
    data=value.encode('utf-16-be');records+=pack('>HHHHHH',3,1,0x409,key,len(data),len(strings));strings+=data
tables['name']=pack('>HHH',0,len(names),6+len(records))+records+strings
tables['post']=pack('>IIhhIIIII',0x30000,0,-100,50,1,0,0,0,0)
tables['OS/2']=pack('>HhHHH',0,600,400,5,0)+pack('>hhhhhhhhhhh',650,600,0,75,650,600,0,350,50,300,0)+bytes([2,11,6,9,2,2,2,2,2,4])+pack('>IIII',1,0,0,0)+b'ORBT'+pack('>HHHhhhHH',64,32,max(ord(c) for c in chars),800,-200,0,800,200)
def checksum(data):
    data+=b'\0'*((-len(data))%4)
    return sum(s.unpack('>'+'I'*(len(data)//4),data))&0xffffffff
tags=sorted(tables);num=len(tags);power=2**(num.bit_length()-1)
header=pack('>IHHHH',0x10000,num,power*16,num.bit_length()-1,num*16-power*16)
directory=b'';body=b'';offset=12+16*num;head_offset=0
for tag in tags:
    data=tables[tag];directory+=tag.encode()+pack('>III',checksum(data),offset,len(data))
    if tag=='head':head_offset=offset
    padded=data+b'\0'*((-len(data))%4);body+=padded;offset+=len(padded)
font=bytearray(header+directory+body)
s.pack_into('>I',font,head_offset+8,(0xB1B0AFBA-checksum(bytes(font)))&0xffffffff)
output = Path(__file__).resolve().parent.parent / 'assets' / 'fonts' / 'OrbitPixel.ttf'
output.parent.mkdir(parents=True, exist_ok=True)
output.write_bytes(font)
print(f'Created OrbitPixel.ttf: {len(font)} bytes, {n} glyphs')
