import random
import string
import threading
import time
from collections import Counter
import math
#모노가토리
# 수정사항
# 1. 암시장 균형의수호자 능력 변경 (코인 숫자 반올림 --> 올림) (파이썬의 반올림이 3.5-->4, 4.5-->4 처럼 우리가 아는 반올림의 개념과 살짝 달라서 바꿈)
# 2. 맞장뜨기 이벤트에서 복리의 축복이 2번 적용되는 버그 수정
# 3. 가이드 나갈 수 있도록 수정
# 4. 아무 의미 없는 4번 줄임
# 5. 1분 후에 숫자 입력 이벤트 추가 (100~300 스테이지에 등장)
# 6. 모든 함수의 global 부분을 한 줄에 다 씀 (차지하는 줄의 수를 줄이려는 목적)
# 7. 어둠의 주사위 눈금수 -2,-1,1,3,5,7 --> -2,-1,2,3,5,8 로 수정 (전에 너무 쓰레기였음)
# 8. 암시장에 주머니저금통, 메모리세이버 제작
# 9. 아무 의미 없는 9번 줄임
# 10. 이벤트에서 찬양이랑 기억이 나오도록 수정
1# 11. 지옥에서 21번 이벤트 주사위 숫자 -1 --> -0.5로 수정 (주사위 숫자 증감이 소수점인 경우 소수점 아래 숫자는 버림) (아니 400코인에 축복 5개에 악세사리 4개에 얻는 코인 증가가 13.6인데 주사위 숫자 증감 때문에 계속 뒤로 가다가 결국 주사위 숫자 증감 -13되고 쭉 후진하다가 죽었잖아 이건 너프 해야지)
# 12. 유명한 자의 길 이벤트 1번 선택지 코인 10% 증가 --> 주사위 숫자 +1 (코인 10% 증가 너무 쓰레기임)

#나중에 쓸 심볼들 🕊️,🦹‍♂️,🏪상점,🪙코인줍기,🍀,❌,⚡,✨,✝️이게 찬양인가,🙏아니면 이게 찬양인가,⭐별의 축복,🌠무언가 낙하,🧠기억,💾메모리세이버?,🌀,🗿,🐉,😈악마 거래,🌋용암,🔥,🐟,🎣선우가 만들 낚시,🚫
rounding = 0
stagenum = [0,-1]
for idea in range(1,461):
  if idea % 10 == 9:
    if idea >= 100 and idea <=200:
      stagenum.append(random.choice([50,52,53,54,55]))
    elif idea > 200 and idea <=300:
      stagenum.append(random.choice([50,51,54,55]))
    elif idea > 300:
      stagenum.append(66)
    else:
      stagenum.append(random.choice([50,51,52]))
  elif idea > 400: # 399스테이지에서 택시 타고 10 갔다가 50각형 주사위로 50 가서 459스테이지 되는 거까지 kan()에서 오류 안 나게 하는 용도로 만든 거
    stagenum.append(0)
  elif idea >= 300 and idea < 400:
    stagenum.append(random.choice([20,21,22,23]))
  elif idea < 300 and idea >= 200:
    stagenum.append(random.choice([1,13,12,4,14,11,15]))
  elif idea >= 100 and idea < 200:
    stagenum.append(random.choice([1,2,11,4,14,5,8]))
  else:
    stagenum.append(random.choice([1,2,3,4,5,6]))
abba = random.randint(1,3)
# 희귀 이벤트 룰렛
if abba == 1:
  stagenum[77] = 77
elif abba == 2:
  stagenum[177] = 77
elif abba == 3:
  stagenum[277] = 77
stage = 0
inputting = 0 # input문이 작동 중인지 확인
fastinput = 0 # fastinput 이벤트가 작동 중이거나 대기 중인지 확인
yatzybank = 0 # 주사위저금통
num = 0
i = 8
star = 0
gambler = 0
thend = 0 # 1이되면 게임이 끝남
hell = 0
dicenow = [1,2,3,4,5,6]
sun = 1
coin = 5
coinp = 0
making = 0 #히든 엔딩 전용
paa = 0 #선택된 축복
coinm = 0  #잃는 코인 증가 = coinm 상승
select = -1
dicep = 0
comp = 0  #복리
edice = 0  #50각형 주사위
famevent = 0  #유명한 자의 길
hdice = 0 #지옥 주사위 횟수
bless = {'복리의 축복' : '코인을 획득 할때마다 앞으로 얻는 코인이 0.2 상승합니다',
         '탐욕의 축복' : '999코인을 즉시 획득하지만 잃는 코인이 100 상승합니다',
         '회귀의 축복' : '지금 상태 그대로 스테이지 0으로 이동합니다.',
         'J의 축복' : '현재 코인의 50%을 획득합니다',
         '주사위의 축복' : '1번 사용할수 있는 1~50까지의 주사위를 획득합니다',
         '안개의 축복' : '현재 적용된 주사위 감소 효과와 잃는 코인 감소 효과가 제거됩니다(최대10)',
         '별들의 축복' : '특별이벤트에 축복을 얻을수 있는 이벤트가 추가됩니다',
         '명성의 축복' : '앞으로 3번의 이벤트가 유명한 자의 길 이벤트로 확정됩니다',
         '신속의 축복' : '지금 상태 그대로 300 스테이지로 이동합니다'}
ac = []
bls = []
#thing = ['하급악마계약서', #얻는 코인+1 잃는 코인+1
#        '중급악마계약서', #코인+10 잃는 코인+1 주사위 숫자-1
#         '상급악마계약서', #코인+15 잃는 코인+2 주사위 숫자-1
#         '주사위저금통',  #주사위를 굴릴때마다 코인+0.5 (10코인)
#         '붕대',         #주사위 숫자+1 (4코인) (상점보다 비싸게 해서 상점을 살리려는 의도)
#         '균형의수호자', #코인 숫자 반올림 (4코인)
#         '칭찬스티커',    #잃는 코인-1 (3코인)
#         '시간의 모래시계', #스태이지 - 50(10코인)
#         '메모리세이버',   # 세이브 생성 (3코인)
#         '무신론',         # 얻는 코인+5 코인+10 더이상 축복 이벤트 등장x , 현재까지 얻은 축복수에 비례해서 디버프 부여
#         '어둠의 주사위',  #주사위 숫자 -2,-1,2,3,5,8
#         '역행성',        # 스테이지 0으로 이동, 얻는 코인 = 0 (15코인)
# 777룰렛: 코인2 소모 룰렛 돌리기 가능, 같은숫자 개수 *2.5 만큼 코인 / 추가로 7 1개마다 1코인 777 50개

thing = {'하급악마계약서' : '얻는 코인+1 / 잃는 코인+1'
         ,'중급악마계약서' : '코인+10 / 잃는 코인+1,주사위 숫자-1'
         ,'상급악마계약서' : '코인+15 / 잃는 코인+2,주사위 숫자-1'
         ,'주사위저금통' : '주사위를 굴릴때마다 코인+0.5 (10코인)'
         ,'붕대' : '주사위 숫자+1 (4코인)'
         ,'균형의수호자' : '정수가 아닌 코인 숫자 항상 올림 (4코인)'
         ,'칭찬스티커' : '잃는 코인-1 (3코인)'
         ,'마왕계약서' : ' 코인+30 잃는 코인+10 얻는 코인+5'
         ,'D의 환생서' : '25%확률로 얻는 코인-1 / 25%확률로 즉시 사망 / 50%확률로 잃는 코인 = 0, 얻는 코인 + 5 (5코인)'
         ,'시간의 모래시계' : '스테이지 - 50 (10코인)'
         ,'메모리세이버' : '세이브 생성 (3코인)'
         ,'무신론' : '얻는 코인+5, 잃는 코인-5, 더이상 축복 이벤트 등장x , 현재까지 얻은 축복수에 비례해서 디버프 부여'
         ,'어둠의 주사위' : '주사위 숫자 -2,-1,2,3,5,8 (5코인)'
         ,'역행성' : '스테이지 0으로 이동, 얻는 코인 = 0 (15코인)'}
thingvalue = {'하급악마계약서' : 0
         ,'중급악마계약서' : 0
         ,'상급악마계약서' : 0
         ,'붕대' : 4
         ,'균형의수호자' : 4
         ,'칭찬스티커' : 3
         ,'마왕계약서' : 0
         ,'D의 환생서' : 5
         ,'시간의 모래시계' : 10
         ,'메모리세이버' : 3
         ,'무신론' : 0
         ,'어둠의 주사위' : 5
         ,'역행성' : 15}
abc = len(thing)

def inputable():
  global fastinput
  while fastinput == 1:
    pass

def tuto():
  global coin
  a = input('가이드 북을 확인하시겠습니까?(네/아니오)')
  if a == '네':
    while True:
      try:
        a = int(input('''1. 목표
2. 이벤트
3. 스텟
4. 기타
5. 저장 데이터 불러오기
6. 가이드 북 나가기/게임시작'''))
      except:
        print('1~6 중의 숫자를 선택해주세요')
        continue
      if a < 1 or a > 6:
        print('1~6 중의 숫자를 선택해주세요')
        continue
      if a == 1:
        print('''
  게임의 기본 목표는 엔딩을 보는 것입니다.
  여러 이벤트들로 코인을 얻고
  주사위를 굴려 결국 400스테이지를 넘어갈 시 노말 엔딩을 완수할 수 있습니다.
  스테이지 300부턴 지옥 스테이지에 입장하며, 코인을 얻을 수 없습니다.
''')
      elif a == 2:
        print('''
  이벤트에는 여러 종류가 있으며 각 이벤트가 등장하는 데 조건이 존재합니다

  1. 일반 이벤트: 아래 모든 조건이 부합되지 않을 때 등장하며
  코인을 조금 얻거나 잃거나 주사위 숫자를 정하는 이벤트 정도가 있습니다.

  2. 특별 이벤트: 스테이지가 10의 배수일 때 등장하며,
  얻는 코인, 잃는 코인을 증가시키거나 감소시키는 이벤트가 있습니다.

  3. 축복 이벤트: 스테이지 100, 200, 300을 넘어갈 때마다 확정으로
  등장하며, 매우 많은 코인을 얻거나 잃는 코인을 없애거나 특별한
  것을 얻는 등 게임에 큰 영향을 미칩니다.

  4. 희귀 이벤트: 특정 스테이지에 랜덤하게 존재합니다.

  5. 지옥 이벤트: 300 스테이지부터 모든 이벤트 대신 등장하며
  코인을 잃거나 잃는 코인을 증가시키는 이벤트만 있습니다.

  6. 히든 이벤트: 게임 어딘가에 숨겨져 있습니다.
''')
      elif a == 3:
        print('''
  게임에 등장하는 스텟 개념입니다

  1. 코인: 게임의 목숨입니다. 0이 되면 죽습니다.
  2. 얻는 코인 증가: 얻는 코인 증가량입니다. 일부 이벤트는 해당되지 않습니다.
  3. 잃는 코인 증가: 잃는 코인 증가량입니다. 일부 이벤트는 해당되지 않습니다.
  4. 주사위 숫자 증감: 주사위 눈금 수에 더해지는 숫자로, 게임 진행을 더 빠르거나 느리게 만듭니다.
  5. 악세사리: 특정 조건 달성 시 얻을 수 있습니다.
  6. 축복: 축복 이벤트에서 얻을 수 있습니다.
''')
      elif a == 4:
        print('''
  선우가 멘트 적을 예정입니다.
''')
      elif a == 5:
        return 1
      else:
        print('가이드 북을 봐주셔서 감사합니다. (코인 +1)')
        coin += 1
        time.sleep(0.7)
        return 0
  else: return 0

def jackpot():
  global coin
  print('룰렛이 돌아갑니다...')
  time.sleep(1.5)
  a = [1,2,3]
  for i in range(1,100):
    a.append(random.randint(1,9))
  print(f'\r[{a[-1]}][{a[-2]}][{a[-3]}]', end='')
  nums = [a[-1],a[-2],a[-3]]
  counter = Counter(nums)

  same_count = max(counter.values())
  print()

  if a[-1] == 7 and a[-2] == 7 and a[-3] == 7:
    print('!!🍀🪙🍀잭팟 당첨🪙🍀🪙!!(코인+77)')
    coin += 77

  if same_count == 1:
    print("꽝🚫 당첨(코인+0)")
    coin += 0
    if nums.count(7) == 1:
      print('싱글 세븐🍀(코인+1)')
      coin += 1
  elif same_count == 2:
    print("페어🪙🪙 당첨(코인+3)")
    coin += 3
    if nums.count(7) == 1:
      print('싱글 세븐🍀(코인+1)')
      coin += 1
    elif nums.count(7) == 2:
      print('더블 세븐🍀🍀!(코인+2)')
      coin += 2
  else:
    print("트리플🪙🪙🪙 당첨(코인+10)")
    coin += 10

def seven():
  global coin, inputting
  chance = 3
  print('희귀 이벤트 발생!')
  time.sleep(0.7)
  print('당신은 숲속 한복판에 서있는 룰렛머신을 발견하였습니다')
  time.sleep(0.7)
  while True:
    if chance == 0:
      print('모든 기회를 소진하였습니다')
      time.sleep(0.7)
      print('룰렛이 더이상 작동하지 않았습니다')
      time.sleep(0.7)
      print('당신은 다시 여정을 떠납니다')
      break
    inputable()
    inputting = 1
    iguess = input(f'룰렛을 돌리시겠습니까?(현재 기회:{chance}) (네/아니오): ')
    inputting = 0
    if iguess == '네':
      jackpot()
      chance -= 1
    elif iguess == '아니오':
      print('당신은 룰렛머신을 떠났습니다')
      break
    else:
      print('네,아니오 중에서만 선택가능합니다')

def item():
  global sun, coinm, coinp, star, coin, stage, dicep, rounding, making, S, J, select, bless, paa, comp, edice, dicenow, famevent, yatzybank
  print(f'당신은 {paa}을/를 구매하셨습니다')
  time.sleep(0.7)
  if paa == '하급악마계약서':
    print('악마와의 계약이 당신에게 새겨집니다')
    time.sleep(0.7)
    coinm += 1
    coinp += 1
    thing.pop('하급악마계약서')
    ac.append('하급악마계약서')

  elif paa == 'D의 환생서':
    time.sleep(0.7)
    thing.pop('D의 환생서')
    ac.append('D의 환생서')
    a = random.randint(1,4)
    if a == 1:
      coin = 0
      print('당신의 신체는 환생의 힘을 견더내지 못하였습니다..')
      time.sleep(2)
      print('사망했습니다...')
    elif a == 3:
      coinp -= 1
      print('당신의 신체는 환생을 견더내기에 살짝 부족했습니다')
      time.sleep(0.7)
      print('얻는 코인이 1 감소했습니다.')
    else:
      coinm = 0
      coinp += 5
      print('당신의 신체는 성공적으로 환생을 마쳤습니다.')
      time.sleep(0.7)
      print('얻는 코인이 5 증가하고, 잃는 코인이 0이 되었습니다.')
  elif paa == '무신론':
    time.sleep(0.7)
    print('당신에게 있던 한줌의 신앙마저 사라지는 것이 느껴집니까?')
    time.sleep(0.7)
    print('더이상 축복 이벤트가 등장하지 않습니다.')
    time.sleep(0.7)
    coinp += 5
    coinm -= 5
    sun += 777
    print('당신의 남은 축복에 비례해 디버프를 획득합니다.')
    time.sleep(1)
    print(f'현재 축복수{len(bls)}개')
    time.sleep(1.5)
    if len(bls) >= 0:
      if len(bls) >= 1:
        if len(bls) >= 2:
          if len(bls) >= 4:
            print('수많은 신들이 당신에게 분노합니다.')
            time.sleep(0.7)
            print('재앙이 다가오고 있습니다. (주사위 숫자-4)')
            dicep -= 4
          print('몇몇 신들이 당신에게 분노합니다.')
          time.sleep(0.7)
          print('저주기 당신의 여정을 함께합니다. (주사위 숫자-1,잃는 코인+1)')
          dicep -= 1
          coinm += 1
        print('몇 안되는 신이 당신에게 분노합니다.')
        time.sleep(0.7)
        print('당신의 몸이 무거워집니다. (주사위 숫자-1)')
        dicep -= 1
      print('신들은 당신에게 관심이 없습니다.')
      time.sleep(0.7)
      print('아무 디버프도 획득하지 않습니다.')

  elif paa == '어둠의 주사위':
    time.sleep(0.7)
    print('주사위 숫자가 -2,-1,2,3,5,8이 되었습니다.')
    dicenow = [-2,-1,2,3,5,8]

  elif paa == '역행성':
    time.sleep(0.7)
    print('시간의 뒤틀림이 당신을 저너머로 날려보냅니다.')
    stage = 0
    coinp = 0
    thing.pop('역행성')
    ac.append('역행성')

  elif paa == '시간의 모래시계':
    time.sleep(0.7)
    print('당신의 시간이 모래시계와 함께 되돌아갑니다.')
    stage -= 50
    time.sleep(1)
    thing.pop('시간의 모래시계')
    ac.append('시간의 모래시계')
  elif paa == '메모리세이버':
    print('세이브가 생성되었습니다.')
    time.sleep(0.7)
    print('게임을 시작할때 게임을 불러 올수 있습니다')
    time.sleep(0.7)
    a = open('save.txt','w')
    a.write(f'''rounding = {rounding}
stagenum = {stagenum}
stage = {stage}
inputting = 0
fastinput = 0
yatzybank = {yatzybank}
i = {i}
star = {star}
gambler = {gambler}
thend = {thend}
S = {S}
J = {J}
hell = {hell}
dicenow = {dicenow}
sun = {sun}
coin = {coin}
coinp = {coinp}
making = {making}
paa = {paa}
coinm = {coinm}
select = {select}
dicep = {dicep}
comp = {comp}
edice = {edice}
famevent = {famevent}
bless = {bless}
ac = {ac}
bls = {bls}
thing = {thing}
thingvalue = {thingvalue}''')
    a.close()
    time.sleep(0.7)
    thing.pop('메모리세이버')
    ac.append('메모리세이버')

  elif paa == '중급악마계약서':
    print('악마와의 계약이 당신에게 새겨집니다')
    time.sleep(0.7)
    coin += 10
    coinm += 1
    dicep -= 1
    thing.pop('중급악마계약서')
    ac.append('중급악마계약서')

  elif paa == '상급악마계약서':
    print('악마와의 계약이 당신에게 새겨집니다')
    time.sleep(0.7)
    coin += 15
    coinm += 2
    dicep -= 1
    thing.pop('상급악마계약서')
    ac.append('상급악마계약서')

  elif paa == '붕대':
    time.sleep(0.7)
    print('움직임이 한결 수월해졌습니다. (주사위 숫자+1)')
    dicep += 1
    thing.pop('붕대')
    ac.append('붕대')

  elif paa == '주사위저금통':
    time.sleep(0.7)
    print('주사위저금통을 획득했습니다. (주사위를 굴릴 때마다 코인 +0.5)')
    yatzybank = 1
    thing.pop('주사위저금통')
    ac.append('주사위저금통')

  elif paa == '균형의수호자':
    time.sleep(0.7)
    print('균형이 당신의 돈을 바로잡습니다.')
    thing.pop('균형의수호자')
    ac.append('균형의수호자')
    rounding = 1

  elif paa == '칭찬스티커':
    time.sleep(0.7)
    print('약간 기분이 좋아졌습니다. (잃는 코인-1)')
    thing.pop('칭찬스티커')
    ac.append('칭찬스티커')
    coinm -= 1

  elif paa == '마왕계약서':
    print('마왕의 힘이 당신에게 새겨집니다. (코인+30 / 잃는 코인+10 / 얻는코인+5)')
    time.sleep(0.7)
    print('마왕이 아주 조금 당신에게 관심을 가집니다. (관심+1)')
    making += 1
    time.sleep(0.7)
    coin += 30
    coinm += 10
    coinp += 5
    thing.pop('마왕계약서')
    ac.append('마왕계약서')

#상점 좀 살려줘라 선우야. 왜 암시장에 상품이 몰려있냐

class Fastinput:
  def mainevent(self):
    global fastinput
    self.number = None
    self.answer = random.randint(0,9)
    print('앞으로 1분 후에 당신이 어떤 이벤트를 하고 있든 간에 입력창이 뜰 것입니다.')
    time.sleep(1)
    print(f"그 입력창이 뜰 경우, 1.5초 이내에 '{self.answer}'를 입력하시오.")
    fastinput = 2
    self.timer = threading.Timer(60, self.showinput)
    self.timer.start()
    return

  def showinput(self):
    global coin, coinm, coinp, inputting, fastinput
    self.timer.cancel()
    self.input_valid = True
    fastinput = 1
    while inputting == 1:
      pass
    self.timer = threading.Timer(1.5, self.timeout)
    self.timer.start()
    self.number = input(f'숫자 {self.answer}를 입력하시오: ')

    if not self.input_valid:
      print("입력 시간이 초과되어 무시되었습니다.")
      fastinput = 0
      return

    self.timer.cancel()

    if self.number == str(self.answer):
      print(f'1.5초만에 {self.answer}을/를 적는 데에 성공하였습니다.')
      time.sleep(0.7)
      print(f'코인을 {2 + coinp}개 얻습니다.')
      coin += 2 + coinp
      time.sleep(0.7)
      cpcheck()

    else:
      print('올바른 숫자를 적지 못했습니다.')
      time.sleep(0.7)
      print(f'코인을 {2 + coinm}개 차감합니다.')
      coin -= 2 + coinm
      time.sleep(0.7)
    fastinput = 0
    return

  def timeout(self):
    global coin, coinm, fastinput
    self.input_valid = False
    self.timer.cancel()
    print(f'1.5초만에 숫자를 적지 못했습니다(coin-{2+coinm}).')
    time.sleep(0.7)
    coin -= 2 + coinm
    time.sleep(0.7)
    fastinput = 0
    return

def cpcheck():
  global coinp, comp
  if comp == 1:
    coinp += 0.2
    time.sleep(0.7)
    print('얻는 코인이 0.2 상승하였습니다')

def black():
  global thing, inputting, coin, paa, abc
  if '칭찬스티커' in ac and '칭찬스티커' in thing:
    thing.pop('칭찬스티커')
  if '붕대' in ac and '붕대' in thing:
    thing.pop('붕대')
  if '균형의수호자' in ac and '균형의수호자' in thing:
    thing.pop('균형의수호자')
  pa = random.sample(range(0,abc) , 4)
  thingkey = list(thing.keys())
  print('암시장 방문 이벤트!')
  time.sleep(1)
  print('당신은 어두운 골목, 사람들 사이에 잊혀진 길에 들어섰습니다')
  time.sleep(0.7)
  print('당신은 그곳에서 그림자와 동화된 듯한 망토를 쓴 상인을 만났습니다')
  time.sleep(0.7)
  print('상인은 당신에게 망토 속 수상하지만 탐날 만한 물건들을 보여주었습니다')
  time.sleep(0.7)
  print(f'''
1: {thingkey[pa[0]]}: {thing.get(thingkey[pa[0]])}
2: {thingkey[pa[1]]}: {thing.get(thingkey[pa[1]])}
3: {thingkey[pa[2]]}: {thing.get(thingkey[pa[2]])}
4: {thingkey[pa[3]]}: {thing.get(thingkey[pa[3]])}
5: 777룰렛을 돌린다 (2코인)
6: 상점을 떠난다''')
  while True:
    try:
      inputable()
      inputting = 1
      buy = int(input(f'1~6중의 숫자를 선택해주세요(현재 코인:{coin}개): '))
    except:
      print('1~6 사이의 숫자를 선택해주세요')
      continue
    inputting = 0
    if buy == 1:
      paa = thingkey[pa[0]]
      if not paa in thing:
        print('이미 구매한 물건입니다')
        continue
      if thingvalue[thingkey[pa[0]]] <= coin:
        abc -= 1
        coin -= thingvalue[thingkey[pa[0]]]
        item()
        if thingkey[pa[0]] == '시간의 모래시계':
          return
        elif thingkey[pa[0]] == '역행성':
          return
      else:
        print('코인이 부족합니다')
        continue
    elif buy == 2:
      paa = thingkey[pa[1]]
      if not paa in thing:
        print('이미 구매한 물건입니다')
        continue
      if thingvalue[thingkey[pa[1]]] <= coin:
        abc -= 1
        coin -= thingvalue[thingkey[pa[1]]]
        item()
        if thingkey[pa[1]] == '시간의 모래시계':
          return
        elif thingkey[pa[1]] == '역행성':
          return
      else:
        print('코인이 부족합니다')
        continue
    elif buy == 3:
      paa = thingkey[pa[2]]
      if not paa in thing:
        print('이미 구매한 물건입니다')
        continue
      if thingvalue[thingkey[pa[2]]] <= coin:
        abc -= 1
        coin -= thingvalue[thingkey[pa[2]]]
        item()
        if thingkey[pa[2]] == '시간의 모래시계':
          return
        elif thingkey[pa[2]] == '역행성':
          return
      else:
        print('코인이 부족합니다')
        continue
    elif buy == 4:
      paa = thingkey[pa[3]]
      if not paa in thing:
        print('이미 구매한 물건입니다')
        continue
      if thingvalue[thingkey[pa[3]]] <= coin:
        abc -= 1
        coin -= thingvalue[thingkey[pa[3]]]
        item()
        if thingkey[pa[3]] == '시간의 모래시계':
          return
        elif thingkey[pa[3]] == '역행성':
          return
      else:
        print('코인이 부족합니다')
        continue
    elif buy == 5:
      if coin < 2:
        print('코인이 부족합니다')
        continue
      coin -= 2
      a = [1,2,3]
      for i in range(1,100):
        a.append(random.randint(1,9))
      print(f'\r[{a[-1]}][{a[-2]}][{a[-3]}]', end='')
      nums = [a[-1],a[-2],a[-3]]
      counter = Counter(nums)

      same_count = max(counter.values())
      print()

      if a[-1] == 7 and a[-2] == 7 and a[-3] == 7:
        print('!!🍀🪙🍀잭팟 당첨🪙🍀🪙!!(코인+77)')
        coin += 77

      if same_count == 1:
        print("꽝🚫 당첨(코인+0)")
        if nums.count(7) == 1:
          print('싱글 세븐🍀!(코인+1)')
          coin += 1
      elif same_count == 2:
          print("페어🪙🪙 당첨(코인+3)")
          coin += 3
          if nums.count(7) == 1:
            print('싱글 세븐🍀!(코인+1)')
            coin += 1
          elif nums.count(7) == 2:
            print('더블 세븐🍀🍀!(코인+2)')
            coin += 2
      else:
        print("트리플🪙🪙🪙 당첨(코인+10)")
        coin += 10
    elif buy == 6:
      print('당신은 상점을 떠났습니다')
      return
    else:
      print('1,2,3,4,5,6 중의 숫자를 선택해주세요')
      continue

def tax():
  global coin, inputting, coinp, coinm
  print('세금 이벤트 발생!')
  time.sleep(0.7)
  print('당신은 세금징수원이 정직하게 당신에게 세금을 요구합니다')
  time.sleep(0.7)
  if not '명성의 축복' in bls:
    print(f'''1.세금 납부(코인-{2+coinm})
2.거절(50% 코인-1 / 50% 코인-{2+coinm}, 잃는 코인 +1)''')
    while True:
      try:
        inputable()
        inputting = 1
        iguess = int(input(''))
      except:
        print('1~2 중의 숫자를 선택해주세요')
        continue
      if iguess <= 0 or iguess > 2:
        print('1~2 중의 숫자를 선택해주세요')
        continue
      break
    inputting = 0
    if iguess == 1:
      print(f'정직하게 세금을 납부하였습니다(코인-{2+coinm})')
      coin -= 2+coinm
    if iguess == 2:
      print('세금징수원으로 부터 도망을 시도합니다...')
      time.sleep(1.5)
      iguess = random.randint(1,2)
      if iguess == 1:
        print('도망에 성공하였습니다')
        time.sleep(0.7)
        print('도망 중 코인을 떨어트렸습니다 (코인-1)')
        coin -= 1
        return
      elif iguess == 2:
          print('도망에 실패하였습니다')
          time.sleep(0.7)
          print(f'세금을 납부하였습니다. 주위 이들이 당신을 비난합니다 (코인-{2+coinm}, 잃는 코인+1)')
          coin -= 2+coinm
          coinm += 1
          return
  else:
    time.sleep(1)
    print('세금징수원이 당신의 명성을 알아봤습니다. 세금에 대한 면제를 받습니다')
    time.sleep(0.7)
    print('당신은 약간 기분이 좋아졌습니다 (얻는 코인+1)')
    coinp += 1
    time.sleep(0.7)
    return


def worship():
  global coin, coinp, coinm, bls, inputting
  print('찬양 이벤트 발생!')
  time.sleep(0.7)
  print('신들이 당신의 신앙심을 확인해 보고 싶어합니다.')
  rand_str = ''
  for k in range(25):
    rand_str += str(random.choice(string.ascii_letters))
  copy_str = '​'.join(rand_str)
  time.sleep(0.7)
  print('다음 예배문으로 신을 찬양하시오.')
  print(copy_str)
  inputable()
  inputting = 1
  iguess = input()
  inputting = 0
  if iguess == rand_str:
    print('당신의 신앙심이 신에게 닿았습니다.')
    time.sleep(0.7)
    return
  elif iguess == copy_str:
    print('신이 당신이 예배문을 복사,붙여넣기 했다는 사실에 분노합니다.')

  else:
    print('신이 잘못된 찬양에 분노합니다.')

  time.sleep(0.7)
  print("'신의 분노'를 획득하였습니다 (얻는 코인-1, 잃는 코인+1)")
  coinp -= 1
  coinm += 1
  if not '신의 분노' in bls:
    bls.append('신의 분노')

def feather():
  global coin, coinp, coinm
  print('?')
  time.sleep(0.7)
  print('당신의 깃털이 성당의 신성함에 강한 빛을 내기 시작합니다')
  time.sleep(0.7)
  print("'천사의 깃털'이 빛이 되어 사라집니다")
  ac.remove('천사의 깃털')
  time.sleep(0.7)
  print('압도적인 후광을 가진 누군가가 당신에게 빛으로 이루어진 무언가를 건넵니다')
  time.sleep(1.5)
  print(f'''  (코인+{10+coinp})
  (잃는 코인-5)
  (얻는 코인+2)''')
  coin += 10 + coinp
  coinm -= 5
  cpcheck()
  coinp += 2
  time.sleep(0.7)
  print('서서히 빛이 사라져 갑니다')
  time.sleep(0.7)
  print('당신은 성당을 빠져나와 신성한 힘이 긷든 채 여정을 다시 시작합니다')
  time.sleep(1)
  return

def holy():
  global coinm, dicep, coin, coinp, inputting
  print('성당 이벤트 발생!')
  time.sleep(0.7)
  print('당신은 우연히 성당에 방문했습니다')
  time.sleep(0.7)
  print('이곳은 신성함이 가득 차 있습니다')
  time.sleep(0.7)
  if '천사의 깃털' in ac:
    feather()
    return
  print('성직자가 당신을 확인합니다')
  time.sleep(0.7)
  print('성직자가 당신의 상태가 좋지 못함을 확인하였습니다')
  time.sleep(0.7)
  a = 1
  b = 0
  if coinm > 0:
    print(f'{a}. 정화를 받는다. (잃는 코인 -1)')
    a += 1
    b = 1
  if dicep < 0:
    print(f'{a}. 치료를 받는다 (주사위 숫자 +1)')
    a += 1
  print(f'{a}. 아무것도 받지 않는다')
  while True:
    try:
      inputable()
      inputting = 1
      iguess = int(input(''))
    except:
      print(f'1~{a} 중의 숫자를 선택해주세요')
      continue
    if iguess <= 0 or iguess > a:
      print(f'1~{a} 중의 숫자를 선택해주세요')
      continue
    break
  inputting = 0
  if iguess == a:
    print('당신은 성당에서 나왔습니다')
    time.sleep(0.7)
    print(f'신성한 기운을 만끽해서인지 우연히 코인을 주웠습니다(코인 +{1 + coinp})')
    time.sleep(0.7)
    coin += 1 + coinp
    cpcheck()
  elif iguess == b:
    print('성직자가 당신을 정화합니다')
    time.sleep(0.7)
    print('신성한 기운이 당신의 영혼을 정화합니다(잃는 코인 -1)')
    time.sleep(0.7)
    coinm -= 1
  else:
    print('성직자가 당신을 치료합니다')
    time.sleep(0.7)
    print('강한 생명력이 당신의 상처를 치료합니다(주사위 숫자 +1)')
    dicep += 1
    time.sleep(0.7)

def memory():
  global coin, coinp, coinm, inputting
  print('기억 이벤트 발생!')
  time.sleep(0.8)
  print('1~3 사이의 숫자가 1.5초 간격으로 12개 나올 것입니다.')
  time.sleep(0.8)
  print('이 숫자들이 나온 순서를 기억하신 후, 입력하시오.')
  time.sleep(0.8)
  for k in range (3,0,-1):
    print(f'\r{k}초 후 시작합니다.', end = '')
    time.sleep(1)
    inputable()
    inputting = 1
  print('\r시작!', end = '')
  time.sleep(1)
  ans = ''
  for k in range (1,13):
    a = str(random.randint(1,3))
    ans += a
    print(f'\r{a}                                         ', end = '')
    time.sleep(0.8)
    print('\r                                             ', end = '')
    time.sleep(0.7)
  a = input('답을 입력하시오: ')
  inputting = 0
  if a == ans:
    print('당신은 12개의 숫자를 모두 기억하는 데에 성공하였습니다.')
    time.sleep(0.7)
    print(f'코인을 {2 + coinp}개 지급합니다.')
    coin += 2 + coinp
    time.sleep(0.7)
    cpcheck()
  else:
    print(f'당신은 숫자를 모두 기억해내는 데에 실패하였습니다. (답: {ans})')
    time.sleep(0.7)
    print(f'코인을 {2 + coinm}개 차감합니다.')
    time.sleep(0.7)
    coin -= 2 + coinm

def e():
  global coin, dicep, stage
  print('히든 이벤트 발생!')
  time.sleep(0.7)
  print('당신은 당신이 어디에 위치해 있는지 인지하지 못합니다')
  time.sleep(0.7)
  print('이곳은 어둠만이 가득 차 있습니다')
  time.sleep(0.7)
  print('마치 세상의 밖 같습니다')
  time.sleep(0.7)
  print('당신은 갑자기 시간의 흐름이 뒤틀리는 것을 느낍니다')
  time.sleep(0.7)
  print('어느새 당신은 당신의 여정이 시작했던 곳에 도달해 있었습니다')
  stage = 0
  time.sleep(0.7)
  dicep += 2
  print('당신은 새롭게 의지를 다지고 여정을 시작합니다(주사위 숫자+2)')
  time.sleep(0.7)

def drag():
  global dicep, coin, coinm, inputting
  print('거대한 무언가 이벤트 발생!')
  time.sleep(0.7)
  print('하늘 위 무언가가 당신을 향해 다가옵니다')
  time.sleep(0.7)
  print('그것의 크기는 당신을 가볍게 짓밟을 수 있을 정도 입니다')
  time.sleep(0.7)
  print('''당신은 그것이 당신에게 해를 입힐지 모르지만
억지로 주사위를 사용해 안전한 곳으로 도망칠 수는 있을 것 입니다.''')
  time.sleep(1)
  print(f'''
  1. 아무런 행동을 하지 않는다 (90%확률로 아무 일도 발생하지 않음, 5%확률로 코인-{10+coinm}, 5% 확률로 ??)
  2. 주사위를 굴린다 (잃는 코인+1)''')
  while True:
    try:
      inputable()
      inputting = 1
      iguess = int(input())
    except:
      print('1이나 2를 선택해 주세요')
      continue
    if iguess > 2 or iguess <0:
      print('1이나 2를 선택해 주세요')
      continue
    break
  inputting = 0
  if iguess == 2:
    print('당신은 억지로 주사위를 굴리면서 도망쳤습니다(잃는 코인+1))')
    time.sleep(0.7)
    print('당신은 이제 안전합니다')
    time.sleep(0.7)
    coinm += 1
    return
  if iguess == 1:
    print('당신은 아무런 행동도 하지 않기로 했습니다')
    time.sleep(0.7)
    iguess = random.randint(1,20)
    if iguess == 1:
      print('불행히도 그것은 당신을 향해 내려오기 시작했습니다')
      time.sleep(0.7)
      print('그것의 뜨거운 열기와 붉은 비늘이 눈에 들어옵니다')
      time.sleep(0.7)
      print(f'당신은 뒤도 돌아보지 않은 채 도망친 덕에 살아남았습니다 (코인-{10+coinm})')
      time.sleep(0.7)
      coin -= 10+coinm
      return
    if iguess == 2:
      print('그것이 당신의 존재를 눈치챘습니다!!')
      time.sleep(1)
      print('그것은 붉은 용이었습니다')
      time.sleep(2)
      print('용은 당신을 향해 불을 뿜었습니다')
      time.sleep(3)
      print('코인을 방패삼아 막으려 시도했습니다(코인-100)')
      coin -= 100
      if coin > 0:
        print('많은 코인이 녹아내렸지만 어떻게든 막아냈습니다')
      else:
        print('불길을 막기에 당신의 코인은 부족했습니다')
        time.sleep(0.7)
        print('사망했습니다')
      time.sleep(0.7)
      return
    else:
      print('예상대로 그것은 당신을 지나쳐 날아갔습니다')
      time.sleep(0.7)
      print('당신은 그것이 당신을 지나쳐갈 때 약간의 열기를 느꼈습니다')
      time.sleep(0.7)
      return

def hgate():
  global stage,thend, coinm, coinp, making, coin, inputting
  print('지옥 입성 이벤트 발생!')
  time.sleep(0.7)
  print('주위 공기가 달라집니다')
  time.sleep(0.7)
  print('당신의 주사위에 지옥의 저주가 부여됩니다(주사위->지옥의 주사위)')
  time.sleep(0.7)
  print('지옥의 주사위가 당신의 힘을 요구합니다')
  time.sleep(0.7)
  while True:
    try:
      inputable()
      inputting = 1
      iguess = input(f'''얻는 코인 1 = 지옥의 주사위 2번
      주사위 숫자 증감 1 = 지옥의 주사위 6번
      ------------------------------------
      1.얻는 코인 소모하여 사용 횟수 충전하기(현재 얻는 코인:{coinp})
      2.주사위 숫자 증감 소모하여 사용 횟수 충전하기(현재 주사위 수자 증감:{dicep})
      3.지옥 입성하기''')
    except:
      print('1~3만 선택가능합니다.')
      continue
    inputting = 0
    if(iguess == 1):
      while True:
        try:
          inputable()
          inputting = 1
          iguess = int(input())
        except:
          print('다시 시도해 주세요')
          continue
        if iguess > coinp:
          print('얻는 코인 보다 낮은 숫자를 입력해주세요')
          continue
        break

    elif(iguess == 2):
      iguess = input(int("주사위 숫자 증감을 몇 소모하시겠습니까?: "))
      time.sleep(0.7)


def ony():
  global paa, i, coin, coinp, inputting
  print('히든 이벤트 발생!')
  time.sleep(0.7)
  print('주사위의 숫자는 당신을 별로 멀지 않은 곳으로 이동시켰습니다')
  time.sleep(0.7)
  print('당신은 잠시 여정에 대한 생각을 시작합니다')
  time.sleep(0.7)
  print('''
  1. 앞으로의 여정을 기대한다
  2. 앞으로의 여정을 걱정한다
  3. 과거의 일을 추억한다''')
  while True:
    try:
      inputable()
      inputting = 1
      iguess = int(input())
    except:
      print('올바른 값을 입력하시오.')
      continue
    if iguess > 3 or iguess < 0:
      print('올바른 값을 입력하시오.')
      continue
    break
  inputting = 0
  if iguess == 1:
    coin += 3
    print('당신은 앞으로의 여정을 기대했습니다')
    time.sleep(0.7)
    print('당신의 기대에 응하듯 바닥에서 코인을 획득하였습니다 (코인+3)')
    time.sleep(0.7)
    cpcheck()
    return
  elif iguess == 2:
    coinp += 1
    print('당신은 앞으로의 여정을 걱정하였습니다')
    time.sleep(0.7)
    print('당신의 걱정은 앞으로의 여정을 침착하게 대처할 수 있게 합니다 (얻는 코인+1)')
    time.sleep(0.7)
  else:
    print('당신은 과거의 일을 추억하였습니다')
    time.sleep(0.7)
    print('.')
    time.sleep(0.5)
    print('..')
    time.sleep(0.5)
    print('...')
    time.sleep(2)
    iguess = random.randint(1,4)
    if iguess == 1:
      if '별들의 축복' in bless:
        print('당신은 별을 보던 하늘을 추억하였습니다!')
        time.sleep(0.7)
        print('마침 하늘 또한 수많은 별들이 떠 있습니다')
        time.sleep(0.7)
        print('당신의 기억이 더욱 선명해지고 있습니다')
        time.sleep(0.7)
        print('별들이 당신을 바라보는 듯 합니다')
        time.sleep(0.7)
        print("'별들의 축복'을 획득하였습니다")
        paa = '별들의 축복'
        i -= 1
        blesses()
      else:
        print('당신은 별을 보던 하늘을 추억하였습니다!')
        time.sleep(0.7)
        print('밤하늘의 별들은 이미 당신을 바라보고 있는 듯 합니다')
        time.sleep(0.7)
        print('당신은 다시 여정을 시작하였습니다')
        time.sleep(0.7)
    else:
      print('당신은 딱히 과거가 생각나지 않았습니다')
      time.sleep(0.7)
      print('당신은 다시 여정을 시작하였습니다')
      time.s

      leep(0.7)

def gam():
  global coinp, coin, gambler, coinm, inputting
  if coin >= 1:
    print('도박장 방문 이벤트!')
    time.sleep(1)
    print('도박이 가능합니다/ 아이고당첨시 0.5배, 실패시 0배, 대박 당첨시 2배, 초대박 당첨시 20배')
    print(f'현재 코인:{coin}')
  while True:
    if coin >= 1:
      try:
        inputable
        inputting = 1
        guncoin = int(input('걸 코인을 정해주세요: '))
      except:
        print('가진 돈의 한에서 자연수를 적어주세요')
        continue
      if guncoin > coin or guncoin <= 0:
        print('가진 돈의 한에서 자연수를 적어주세요')
        continue
      inputting = 0
      coin -= guncoin
      print('...')
      time.sleep(1)
      gamble = random.randint(1,100)
      if 0 < gamble <= 33 :
        print('아이고 당첨!')
        print('아이고..(건 돈이 0.5배로 줄어듭니다)')
        coin += guncoin*0.5
      elif gamble == 34:
        print('초대박 당첨!')
        print('초대박! (건 돈이 20배로 늘어납니다)')
        coin += guncoin*20
      elif 34 < gamble <= 67 :
        print('실패 당첨!')
        print('실패..(건 돈이 사라집니다)')
        if guncoin >= 10:
          if not '도파민 중독 자격증' in ac:
            time.sleep(2)
            print('?')
            ac.append('도파민 중독 자격증')
            time.sleep(0.7)
            print('도박사가 당신에게 무언가가 적힌 종이를 건넵니다')
            time.sleep(0.7)
            print('도파민 중독 자격증을 획득하였습니다')
            time.sleep(0.7)
            print('당신은 도파민에 중독되었습니다(코인+1)')
            coin += 1
            time.sleep(0.7)
      else:
        print('대박 당첨!')
        print('이게 되네(건 돈이 2배가 됩니다)')
        coin += guncoin*2
        if guncoin >= 10:
          if not '도박사 자격증' in ac:
            time.sleep(2)
            print('?')
            ac.append('도박사 자격증')
            coinp += 1
            time.sleep(0.7)
            print('도박사가 당신에게 무언가가 적힌 종이를 건넵니다')
            time.sleep(0.7)
            print('도박사 자격증을 획득하였습니다')
            time.sleep(0.7)
            print('얻는 코인이 1 상승하고 얻는 코인이 1미만으로 하락하지 않습니다')
            time.sleep(0.7)
            gambler = 1
      return
    else:
      print('도박장에 온 거지 이벤트 발생!')
      time.sleep(1)
      print(f'도박장에 왔으나, 돈이 너무 적습니다. ({coin}개)')
      print('모든 돈을 걸고 도박을 합니다. (실패 시 돈을 잃고, 성공 시 가진 코인이 1이 됩니다.)\n...')
      time.sleep(1)
      gamble = random.randint(1,2)
      if gamble == 1:
        print('실패 당첨!')
        print('실패..(모든 돈을 잃습니다.)')
        coin = 0
      else:
        print('대박 당첨!')
        print('이게 되네 (코인이 1이 됩니다.)')
        coin = 1
        if not '거지코인' in ac:
          time.sleep(2)
          print('?')
          coinm -= 1
          time.sleep(0.7)
          print('도박사가 당신에게 낡은 동전을 건넵니다')
          time.sleep(0.7)
          print("'거지코인' 획득!")
          time.sleep(0.7)
          ac.append('거지코인')
          print('잃는 코인이 1 감소합니다.')
          time.sleep(0.7)
      return

def taxy():
  global coin, stage
  print('택시 아저씨 이벤트!')
  time.sleep(1)
  print(f'코인 1개를 지불해 스테이지 1~10을 즉시 이동합니다')
  time.sleep(1)
  inputable()
  inputting = 1
  taxi = input('택시에 타시겠습니까? (네/아니오)')
  inputting = 0
  if taxi == '네':
    coin -= 1
    print('택시에 탑승하셨습니다. 코인 1개를 지불 하였습니다')
    time.sleep(0.7)
    print('택시 타고 가는중')
    time.sleep(0.7)
    print('택시 타고 가는중.')
    time.sleep(0.7)
    print('택시 타고 가는중..')
    time.sleep(0.7)
    print('택시 타고 가는중...')
    time.sleep(1.5)
    taxi = random.randint(1,10)
    stage += taxi
    print(f'택시를 타서 스테이지 {taxi}만큼 이동하셨습니다!')
  else:
    print('택시를 타지 않으셨습니다')

def coinpm(m1,m2,cpm):
  global coin, coinm
  print(m1)
  time.sleep(0.7)
  print('%s (코인 {:+g})'.format(cpm) %(m2))
  if cpm > 0:
    cpcheck()
  coin += cpm

def lava():
  global coin, dicep
  print('지옥 이벤트4 발생!')
  time.sleep(0.7)
  print('당신은 용암위를 건너다 화상을 입었습니다. (주사위 숫자-0.5)')
  time.sleep(0.7)
  dicep -= 0.5
  return

def hund(): # guncoin=정답, gamble=플레이어 답, apt=시도횟수
  global coin, coinp, coinm, inputting
  guncoin = random.randint(1,99)
  print('숫자 맞추기 이벤트!')
  time.sleep(0.7)
  print('1부터 99까지의 자연수 중 하나를 생각했습니다.')
  time.sleep(0.7)
  print('6번 안에 이 숫자를 맞추시오.')
  time.sleep(0.7)
  apt = 0
  while apt != 6:
    print(f'{apt + 1}차 시도')
    while True:
      try:
        inputable()
        inputting = 1
        gamble = int(input('숫자 입력: '))
      except:
        print('1~99의 자연수를 입력하시오.')
        continue
      if gamble > 99 or gamble < 1:
        print('1~99의 자연수를 입력하시오.')
        continue
      break
    if gamble > guncoin:
      print(f'{gamble}은/는 제가 생각한 숫자보다 큽니다.')
    elif gamble < guncoin:
      print(f'{gamble}은/는 제가 생각한 숫자보다 작습니다.')
    else:
      inputting = 0
      print(f'{gamble}! 정답입니다! (코인 +{2+coinp})')
      coin += 2 + coinp
      cpcheck()
      return
    apt += 1
  inputting = 0
  print(f'정답은 {guncoin}이었습니다')
  print(f'6번안에 정답을 맞추지 못하였습니다. (코인 -{2+coinm})')
  coin -= 2 + coinm

def fight():
  global coin, coinp, coinm
  print('맞장뜨기 이벤트 발생!')
  time.sleep(0.7)
  print('50%의 확률로 돈을 얻고 50% 확률로 돈을 잃습니다')
  time.sleep(0.7)
  print('싸우는 중.')
  time.sleep(0.7)
  print('싸우는 중..')
  time.sleep(0.7)
  print('싸우는 중...')
  time.sleep(1.5)
  apt = random.randint(1,2)
  if apt == 1:
    print(f'간신히 이겨냈습니다!(코인 +{2+coinp})')
    coin += 2+coinp
    cpcheck()
  else:
    print(f'개 처발렸습니다!(코인 -{2+coinm})')
    coin -= 2+coinm

def clover():
  global dicep, coinp, coinm, inputting
  print('특별 이벤트 발생!')
  time.sleep(0.7)
  print('당신은 우연히 클로버 밭을 발견하였습니다')
  time.sleep(0.7)
  print('행복과 행운의 기운이 가득한 찬 이곳에서 당신은 한 클로버를 집어들었습니다')
  time.sleep(0.7)
  print(''' 50% 3잎클로버  (얻는 코인+1)
    25% 1잎 클로버  (얻는 코인+0.5)
    10% 4잎 클로버  (얻는 코인+2)
    5%  5잎 클로버  (잃는 코인-2)
    5%  7잎 클로버  (주사위 숫자+1)
    5%  20잎 클로버 (얻는 코인+3.5, 잃는 코인-2, 주사위 숫자+1)''')
  inputable()
  inputting = 1
  input('아무거나 입력: ')
  inputting = 0
  iguess = random.randint(1,20)
  if iguess >= 1 and iguess <= 10:
    print('작은 행복을 집어들었습니다')
    time.sleep(0.7)
    print('3잎 클로버(얻는 코인+1)')
    coinp += 1
  elif iguess >= 11 and iguess <= 15:
    print('과거의 기억을 집어들었습니다')
    time.sleep(0.7)
    print('2잎 클로버(잃는 코인-1)')
    coinm -= 1
  elif iguess == 16 or iguess == 17:
    print('우연한 행운을 집어들었습니다')
    time.sleep(0.7)
    print('4잎 클로버(얻는 코인+2)')
    coinp += 2
  elif iguess == 18:
    print('잠들어 있던 용기를 집어들었습니다')
    time.sleep(0.7)
    print('5잎 클로버(잃는 코인-2)')
    coinm -= 2
  elif iguess == 19:
    print('잊고있던 추억을 집어들었습니다')
    time.sleep(0.7)
    print('7잎 클로버(주사위 숫자+1)')
    dicep += 1
  elif iguess == 20:
    print('희망을 집어들었습니다!')
    time.sleep(0.7)
    print('20잎 클로버(얻는 코인+3.5, 잃는 코인-2, 주사위 숫자+1)')
    coinp += 3.5
    coinm -= 2
    dicep += 1
  return

def famous():
  global dicep, famevent, coinp, coinm, inputting
  famevent -= 1
  print('유명한 자의 길 이벤트 발생!')
  print('''
1. 주사위 숫자 +1
2. 잃는 코인 1감소
3. 얻는 코인 1증가''')
  while True:
    try:
      inputable()
      inputting = 1
      guncoin = int(input('원하는 것을 선택하시오: '))
    except:
      print('1,2,3 중의 숫자를 입력해주세요.')
      continue
    inputting = 0
    if guncoin == 1:
      dicep += 1
      print('상인들이 당신을 후원합니다')
      time.sleep(0.7)
      print('주사위 숫자가 1 증가했습니다.')
      time.sleep(0.7)
      cpcheck()
    elif guncoin == 2:
      coinm -= 1
      print('시민들이 당신의 여정을 축복합니다')
      time.sleep(0.7)
      print('잃는 코인이 1 감소합니다.')
      time.sleep(0.7)
    elif guncoin == 3:
      coinp += 1
      print('시인들이 당신의 여정을 이야기 합니다')
      time.sleep(0.7)
      print('얻는 코인이 1 증가합니다.')
      time.sleep(0.7)
    else:
      print('1,2,3 중의 숫자를 입력해주세요.')
      time.sleep(0.7)
      continue
    return

def outlaw():
  global coin, coinm, dicep, inputting
  print('강도 습격 이벤트!')
  time.sleep(0.7)
  print('강도가 당신을 습격하였습니다')
  time.sleep(0.7)
  print(f'코인 {2 + coinm}를 지불하거나 부상(주사위 숫자-1)을 입게 됩니다')
  time.sleep(0.7)
  inputable()
  inputting = 1
  iguess = input(f'코인 {2 + coinm}개를 지불 하시겠습니까?(네,아니오): ')
  inputting = 0
  if iguess == '네':
    print('코인을 지불하셨습니다')
    coin -= 2 + coinm
    time.sleep(1)
    return
  else:
    print('당신은 코인을 지불하지 않으셨습니다')
    time.sleep(0.7)
    print('부상(주사위 숫자-1)을 입었습니다')
    time.sleep(0.7)
    dicep -= 1
    time.sleep(1)

def devil():
  global coinp, stage, coinm, inputting
  print('악마의 거래 이벤트 발생!')
  time.sleep(0.7)
  print('악마가 당신에게 제안 합니다')
  time.sleep(0.7)
  print('앞으로 얻는 코인의 개수가 1개 늘어나지만 잃는 코인의 개수도 1개 늘어납니다 (일부 이벤트는 해당 안됨)')
  time.sleep(0.7)
  inputable()
  inputting = 1
  iguess = input('수락 하시겠습니까?(네/아니오)')
  inputting = 0
  if iguess == '네':
    coinp += 1
    coinm += 1
    print('당신은 악마의 거래를 받아드렸습니다')
    time.sleep(1)
  else:
    print('당신은 악마의  거래를 거절했습니다')
    time.sleep(1)
  return

def acma3():
  global coin
  guncoin = round(coin*1/10)
  if guncoin < 1:
    guncoin = 1
  coin -= guncoin
  print('지옥 이벤트3 발생!')
  time.sleep(0.7)
  print(f'주위 불길이 당신의 코인을 녹입니다(가진코인-10%({guncoin}))')
  time.sleep(0.7)

def baram():
  global select, inputting
  print('바람의 정령 이벤트 발생!')
  time.sleep(1)
  print('바랑의 정령이 당신의 여정을 돕습니다')
  time.sleep(0.7)
  while True:
    try:
      inputable()
      inputting = 1
      select = int(input('다음 주사위 눈금 수를 정해주세요(1~6): '))
    except:
      print('1~6중의 정수를 입력해주세요')
      continue
    if select > 6 or select < 1:
      print('1~6중의 정수를 입력해주세요')
      continue
    inputting = 0
    print('바람이 당신의 주사위를 감싸기 시작합니다')
    time.sleep(0.7)
    print(f'다음 이동거리가 {select}이/가 되었습니다')
    return

def angel():
  global select, inputting
  print('기도 이벤트 발생!')
  time.sleep(1)
  print('천사의 형상 앞에서 당신은 기도를 합니다')
  time.sleep(0.7)
  while True:
    try:
      inputable()
      inputting = 1
      select = int(input('다음 주사위 눈금 수를 정해주세요(1~3): '))
    except:
      print('1~3중의 정수를 입력해주세요')
      continue
    if select > 3 or select < 1:
      print('1~3중의 정수를 입력해주세요')
      continue
    inputting = 0
    print('천사가 당신의 기도를 들었습니다')
    time.sleep(0.7)
    print('신성한 빛이 당신의 주사위에 흡수됩니다')
    time.sleep(0.7)
    print(f'다음 이동거리가 {select}이/가 되었습니다')
    iguess = random.randint(1,10)
    if iguess == 1:
      if not '천사의 깃털' in ac:
        time.sleep(2)
        print('?')
        time.sleep(0.7)
        print('빛과 함께 깃털이 떨어졌습니다')
        time.sleep(0.7)
        print("'천사의 깃털' 획득!")
        time.sleep(0.7)
        print('주사위를 굴릴때 50% 확률로 숫자 +1(1~6숫자 주사위만)')
        iguess = 0
        ac.append('천사의 깃털')
    return

def shop():
  global coin, coinp, coinm, dicep, inputting
  print('상점 방문 이벤트!')
  time.sleep(0.7)
  cpcheck()
  coin += 2 + coinp
  print(f'코인 {2 + coinp}개를 드립니다. (현재 코인 {coin}개)')
  cpcheck()
  time.sleep(0.7)
  if not 'J의 축복' in bless:
    print(f'''
  상품 목록
  1. 주사위 숫자 +1 ({3 + coinm}코인)
  2. 얻는 코인 +0.5 ({6 + coinm}코인)
  3. J의 복권 (코인 0~{(4 + coinp) * 6}개 획득 가능) ({4 + coinm}코인)
  4. 아무것도 안 사기
''')
    while True:
      try:
        inputable()
        inputting = 1
        guncoin = int(input('사고 싶은 상품 번호를 입력해주세요: '))
      except:
        print('1~4 중에서 입력해주세요')
        continue
      if guncoin > 4 or guncoin <1:
        print('1~4 중에서 입력해주세요')
        continue
      break
    inputting = 0
    if guncoin == 1 and coin >= 3 + coinm:
      coin -= 3 + coinm
      print('주사위 숫자가 1 증가했습니다.')
      dicep += 1
    elif guncoin == 2 and coin >= 7 + coinm:
      coin -= 6 + coinm
      print('얻는 코인이 0.5 증가했습니다.')
      coinp += 0.5
    elif guncoin == 3 and coin >= 4 + coinm:
      coin -= 4 + coinm
      print('복권을 구매하였습니다.')
      time.sleep(0.7)
      guncoin = random.sample(range(1,45) , 7)
      apt = guncoin[6]
      guncoin.pop()
      guncoin.sort()
      print('1~45 사이의 번호 중 6개의 번호와 1개의 보너스 번호를 추첨하였습니다.')
      print('숫자 6개를 입력하시오.')
      lottolist = []
      while len(lottolist) != 6:
        try:
          inputable()
          inputting = 1
          gamble = int(input(''))
        except:
          print('올바른 값을 입력하세요')
          continue
        if gamble > 45 or gamble < 1 or gamble in lottolist:
          print('올바른 값을 입력하세요')
          continue
        lottolist.append(gamble)
      lottolist.sort()
      inputting = 0
      time.sleep(0.7)
      print(f'선택한 번호: {lottolist[0]} {lottolist[1]} {lottolist[2]} {lottolist[3]} {lottolist[4]} {lottolist[5]}')
      time.sleep(0.9)
      print('로또번호를 공개합니다.')
      time.sleep(1)
      print(f'번호는 {guncoin[0]} {guncoin[1]} {guncoin[2]} {guncoin[3]} {guncoin[4]} {guncoin[5]} - {apt} 였습니다!')
      guncoin = list(set(guncoin) & set(lottolist)) # 두 리스트 사이의 교집합을 구하는 코드
      if apt in lottolist:
        apt = 4 + coinp
      else: apt = 0
      time.sleep(0.9)
      print(f'코인 {len(guncoin) * (4 + coinp) + apt}개를 지급합니다.')
      coin += len(guncoin) * (4 + coinp) + apt
      if len(guncoin) * (4 + coinp) + apt > 0:
        cpcheck()
    else:
      print('상점을 나갔습니다.')
    return
  print(f'''
  상품 목록
  1. 주사위 숫자 +1 ({3 + coinm}코인)
  2. 얻는 코인 +0.5 ({6 + coinm}코인)
  3. 잠김 (?코인)
  4. 아무것도 안 사기
''')
  while True:
    try:
      inputable()
      inputting = 1
      guncoin = int(input('사고 싶은 상품 번호를 입력해주세요: '))
    except:
      print('1~4 중에서 입력해주세요')
      continue
    if guncoin > 4 or guncoin <1:
      print('1~4 중에서 입력해주세요')
      continue
    if guncoin == 3:
      print('해금 조건이 걸린 상품입니다. 다른 것을 구매하십시오.')
      continue
    break
  inputting = 0
  if guncoin == 1 and coin >= 3 + coinm:
    coin -= 3 + coinm
    print('주사위 숫자가 1 증가했습니다.')
    dicep += 1
  elif guncoin == 2 and coin >= 7 + coinm:
    coin -= 6 + coinm
    print('얻는 코인이 0.5 증가했습니다.')
    coinp += 0.5
  else: print('상점을 나갔습니다')
  return

def acma1():
  global coinm, dicep
  print('지옥 이벤트5 발생')
  time.sleep(0.7)
  print('이름모를 악마가 당신을 저주합니다(잃는 코인+1)')
  coinm += 1
  return

def acma2():
  global coinm
  print('지옥 이벤트2 발생')
  time.sleep(0.7)
  print('숨어있던 악마가 당신을 공격합니다(잃는 코인+2)')
  time.sleep(0.7)
  coinm += 2
  return

def dice():
  global select, dicenow, yatzybank, coin, dicep
  dice = 0
  if select != -1:
    dice = select
    return dice
  else:
    dice = random.choice(dicenow)
    if '천사의 깃털' in ac:
      iguess = random.randint(1,2)
      if iguess == 1:
        print('천사의 깃털이 약간의 빛을 바랩니다(주사위 숫자 +1)')
        dice += 1
        time.sleep(0.7)
  dice += math.floor(dicep)
  if yatzybank == 1:
    print('주사위저금통이 코인을 주었습니다. (코인 +0.5)')
    coin += 0.5
  return dice

def kan():
  global stage, num
  for i in range(num + 1):
    k = stage + i
    print(f'\r({stagenum[k]}) [{stagenum[k + 1]}] [{stagenum[k + 2]}] [{stagenum[k + 3]}] [{stagenum[k + 4]}]', end = '')
    if i == 0: time.sleep(1)
    else: time.sleep(1.5/num)
  print()

def blesses():
  global sun, coinm, coinp, star, coin, stage, dicep, select, bless, paa, comp, edice, famevent

  if paa == '복리의 축복':
    print('당신은 이유 모를 안전함이 느껴집니다')
    time.sleep(0.7)
    print('코인을 획득할 때마다 얻는 돈이 0.2 상승합니다')
    time.sleep(0.7)
    bless.pop('복리의 축복')
    comp = 1
    bls.append('복리의 축복')

  elif paa == '탐욕의 축복':
    coin += 999
    coinm += 100
    print('끝없는 어둠 속에서 돈의 비가 떨어집니다')
    time.sleep(0.7)
    print('하지만 그 어둠은 당신을 향해 기분 나쁜 웃음을 짓는 듯 합니다')
    time.sleep(0.7)
    print('999코인을 획득하셨습니다')
    time.sleep(0.7)
    print('잃는 돈이 100코인 상승합니다')
    time.sleep(0.7)
    bless.pop('탐욕의 축복')
    bls.append('탐욕의 축복')

  elif paa == '회귀의 축복':
    stage = 0
    print('당신은 시간의 흐름이 뒤틀리는 것을 느낌니다')
    time.sleep(0.7)
    print('어느새 당신은 당신의 여정이 시작되는 곳에 도달해 있었습니다')
    time.sleep(0.7)
    print('스테이지 0으로 되돌아갔습니다')
    time.sleep(0.7)
    bless.pop('회귀의 축복')
    bls.append('회귀의 축복')

  elif paa == 'J의 축복':
    coin *= 1.5
    print('강한 빛이 당신을 바라보는 것을 느낍니다')
    time.sleep(0.7)
    print('동시에 당신은 주머니 속 코인이 요동치고 있다는 것을 알게 됐습니다')
    time.sleep(0.7)
    print('당신의 코인이 50% 증가하였습니다')
    time.sleep(0.7)
    bless.pop('J의 축복')
    bls.append('J의 축복')

  elif paa == '주사위의 축복':
    print('하늘에서 주사위 하나가 떨어집니다.')
    time.sleep(0.7)
    print('그것은 수많은 각을 가져 마치 구처럼 보입니다')
    time.sleep(0.7)
    print('50각형 주사위를 획득하였습니다.')
    time.sleep(0.7)
    print('1번 1~50 중 원하는 수만큼 스테이지를 이동할수 있습니다')
    bless.pop('주사위의 축복')
    edice = 1
    bls.append('주사위의 축복')

  elif paa == '안개의 축복':
    print('흰안개가 당신의 시야를 가리기 시작합니다')
    time.sleep(0.7)
    print('당신은 영혼이 정화되는 듯한 느낌을 받습니다')
    time.sleep(0.7)
    print('현재 적용된 주사위 감소 효과 및 잃는 코인 감소 효과가 제거됩니다')
    time.sleep(0.7)
    bless.pop('안개의 축복')
    if coinm > 10:
      coinm -= 10
    else: coinm = 0
    if dicep < -10:
      dicep += 10
    elif not dicep > 0: dicep = 0
    bls.append('안개의 축복')

  elif paa == '별들의 축복':
    print('하늘의 수많은 별들이 쏟아집니다.')
    time.sleep(0.7)
    print('몇몇 별들은 별로 멀지 않은 곳에 떨어진 듯 합니다')
    time.sleep(0.7)
    print('특별 이벤트에 축복의 별 이벤트가 추가됩니다')
    time.sleep(0.7)
    bless.pop('별들의 축복')
    star = 1
    for i in range(stage,300):
      if(i%5 == 0):
        stagenum[i] = 49
    bls.append('별들의 축복')

  elif paa == '명성의 축복':
    print('당신의 등에서 후광이 느껴집니다.')
    time.sleep(0.7)
    print('세상이 당신을 주시하는 느낌을 받습니다')
    time.sleep(0.7)
    print('앞으로 3번 이벤트가 유명한 자의 길로 확정됩니다')
    time.sleep(0.7)
    bless.pop('명성의 축복')
    famevent = 3
    bls.append('명성의 축복')

  else:
    stage = 300
    print('당신은 시간의 흐름이 뒤틀리는 것을 느낍니다')
    time.sleep(0.7)
    print('당신은 어느새 지옥을 연상케 하는 장소에 도달해 있었습니다')
    time.sleep(0.7)
    print('스테이지 300으로 이동합니다')
    time.sleep(0.7)
    bless.pop('신속의 축복')
    bls.append('신속의 축복')

def blessevent():
  global sun, bless, paa, coinm, coinp, i, inputting

  pa = random.sample(range(0,i) , 3)
  print('축복 이벤트 발생!')
  sun += 1
  time.sleep(0.7)
  print('당신은 축복 중 한가지를 받을 수 있습니다.')
  time.sleep(0.7)
  print('획득한 축복은 더이상 이번 판에 등장하지 않습니다')
  time.sleep(0.7)
  blesskey = list(bless.keys())
  print(f'''
1: {blesskey[pa[0]]}: {bless.get(blesskey[pa[0]])}
2: {blesskey[pa[1]]}: {bless.get(blesskey[pa[1]])}
3: {blesskey[pa[2]]}: {bless.get(blesskey[pa[2]])}
4: 축복을 거절한다(디버프 부여)''')

  while True:
    try:
      inputable()
      inputting = 1
      qwerty = int(input('1~4중의 숫자를 선택해주세요: '))
    except:
      print('1,2,3,4 중의 숫자를 선택해주세요')
      continue
    inputting = 0
    if qwerty == 1:
      paa = blesskey[pa[0]]
      i -= 1
      blesses()
    elif qwerty == 2:
      paa= blesskey[pa[1]]
      i -= 1
      blesses()
    elif qwerty == 3:
      paa = blesskey[pa[2]]
      i -= 1
      blesses()
    elif qwerty == 4:
      print('''
당신은 축복을 받는 것을 거절하셨습니다.
당신은 약간 신들의 분노를 일으켰습니다. (얻는 코인-1, 잃는 코인+1)''')
      coinm += 1
      coinp -= 1
    else:
      print('1,2,3,4 중의 숫자를 선택해주세요')
      continue
    return

def starevent():
  global bless, paa, i, inputting

  pa = random.randint(1,i)
  print('별의 축복 이벤트 발생!')
  time.sleep(0.7)
  print('당신은 추락해있는 별 하나를 발견하였습니다')
  time.sleep(0.7)
  print('별 안에는 어떤 축복이 담겨있는듯 합니다')
  time.sleep(0.7)
  print('당신은 축복을 받을지 말지 선택하실수 있습니다.')
  time.sleep(0.7)
  print('획득한 축복은 더이상 이번 판에 등장하지 않습니다')
  time.sleep(0.7)
  blesskey = list(bless.keys())
  print(f'''
1: {blesskey[pa]}: {bless.get(blesskey[pa])}
2: 별을 무시한다''')

  while True:
    try:
      inputable()
      inputting = 1
      qwerty = int(input('숫자를 선택해주세요: '))
    except:
      print('1,2 중의 숫자를 선택해주세요')
      continue
    inputting = 0
    if qwerty == 1:
      paa = blesskey[pa]
      i -= 1
      blesses()
    elif qwerty == 2:
      print(''' 당신은 별을 무시하고 발걸음을 옮깁니다''')
    else:
      print('1,2 중의 숫자를 선택해주세요')
      continue
    return

def sung():
  pass

def spevent(stri):
  print('특별 이벤트 발생!') #왕의 조세 징수(명성의 축복) #마왕의 흔적
  time.sleep(0.7)
  if stri == 66: #지옥 특별 이벤트
    sung()
    return

  if stri == 50: # 악마의 거래
    devil()
    return

  if stri == 51: # 강도 습격
    outlaw()
    return

  if stri == 52: # 상점 방문
    shop()
    return

  if stri == 53: #성당
    holy()
    return

  if stri == 54: #블마
    black()
    return

  if stri == 55: #세금
    tax()
    return

def event():
  global coinm, coinp, stage, famevent, sun, star, fastinput

  stri = stagenum[stage]
  print('이벤트 계산 중입니다')
  time.sleep(0.5)
  print('...')
  time.sleep(0.5)
# 특별 이벤트
  if famevent > 0: # 명성의 축복 전용 이벤트
    famous()
    return

  if stage - 100 * sun >= 0: # 축복 이벤트
     blessevent()
     return

  if stri == 49 and star == 1: # 별의 축복 특별 이벤트
    if stage > 300:
      print('특별 이벤트 발생!')
      time.sleep(0.7)
      print('당신은 추락한 별을 발견하였습니다')
      time.sleep(0.7)
      print('하지만 이곳의 열기와 악마들로 인해 별 안에는 아무것도 들어있지 않았습니다')
      return
    starevent()
  elif stri == 49 and star == 0: # 별의 축복이 없지만 걸렸을 때 랜덤 특별 이벤트
    spevent(random.randint(50,53))
  elif stri > 49:
    spevent(stri) # 기존에 정해져 있던 특별 이벤트

#################################

#히든 이벤트
  if stage <= 0: # 0이하 스테이지 히든 이벤트
    e()
    stage = 0

  if stri == -1: # 1스테이지 히든 이벤트
    ony()

####################################

#메인 이벤트
  if stri == 1: # 맞장뜨기
    fight()

  if stri == 2: # 삥 뜯기기
    coinpm('삥 뜯기기 이벤트 발생!','코인을 삥 뜯겼습니다',-1 - coinm)

  if stri == 3: # 복권 당첨
    coinpm('코인줍기 이벤트 발생!','우연히 코인을 주었습니다',1 + coinp)

  if stri == 4: # 도박장 / 도박장 거지
    gam()

  if stri == 5: # 택시 아저씨
    taxy()

  if stri == 6: # 천사의 축복
    angel()

  if stri == 7: # 숫자 맞추기
    hund()

  if stri == 8: # 무언가 낙하
    drag()

  if stri == 9: # 찬양
    worship()

  if stri == 10: # 기억
    memory()

  if stri == 11: # 코인뭉치 줍기
    coinpm('코인뭉치 이벤트 발생!','코인뭉치를 주웠습니다',2 + coinp)

  if stri == 12: # 코인주머니 줍기
    coinpm('코인주머니 이벤트 발생!','코인주머니를 주웠습니다',3 + coinp)

  if stri == 13: # 코인 털리기
    coinpm('코인 털리기 이벤트 발생!','깡패에게 코인을 털렸습니다',-2 - coinm)

  if stri == 14: #천사 깃털 무한 공급 방지용 상위호환 나중에 좀 바꿀거
    baram()

  if stri == 15: #1분 후 숫자 입력
    if fastinput == 0:
      fastinput = 1
      game = Fastinput()
      game.mainevent()
    else:
      print('쉬어가기 이벤트 발생!')
      time.sleep(1)
      print('아무 일도 일어나지 않았습니다.')
      time.sleep(0.7)

  if stri == 20: #지옥 이벤트1
    coinpm('지옥 이벤트1 발생!','악마로 부터 도망치다 코인을 잃었습니다',-3 - coinm)

  if stri == 21: #지옥 이벤트4
    lava()

  if stri == 22: #지옥이벤트5
    acma1()

  if stri == 23: #지옥이벤트2
    acma2()
 #--------------------------희귀 이벤트
  if stri == 77:
    seven()

  if stri == 24: #지옥 이벤트3
    acma3()

# 300 ~ 400 -> 지옥 1~100 인식의 변화
# 300이 그냥의 끝 이후 100까지 갈시 보상
#

coinm = tuto()
if coinm == 1:
  try:
    print('저장 데이터를 불러오고 있습니다...')
    coinm = open('save.txt','r')
    dicep = coinm.read()
    exec(dicep)
    coinm.close()
  except:
    print('저장 데이터를 불러오지 못했습니다.')
  coinm = 0
  dicep = 0
print('**************LuCKy DIcE***************')
print('당신은 새로운 여정을 시작하셨습니다')
time.sleep(1)
print(f'게임 시작/현재코인({coin})')
while True:
  if thend == 1:
    time.sleep(1)
    break
  if coin <= 0:
    print('당신은 모든 돈을 잃었습니다')
    time.sleep(2)
    print('.')
    time.sleep(1)
    print('..')
    time.sleep(1)
    print('...')
    time.sleep(1)
    print()
    print('더이상 여정을 계속하기에는 불가능할 것 같습니다')
    time.sleep(1)
    print('당신은 당신이 왔던 길을 되돌아가 다시 새로운 여정을 준비합니다')
    time.sleep(1)
    print()
    print('당신의 여정이 마침내 끝을 맞이하였습니다')
    print(f'{stage}달성')
    break
  if stage > 300 and hell == 0:
    print('지옥에 입장하였습니다')
    time.sleep(0.7)
    print('당신의 여정이 얼마 남지 않았습니다')
    time.sleep(0.7)
    hell = 1
  elif stage <= 300 and hell == 1:
    print('당신은 지옥을 빠져나왔습니다')
    time.sleep(0.7)
    hell = 0
  if edice == 1:
    inputable()
    inputting = 1
    edice = input('50각형 주사위를 굴릴까요? (예/아니오): ')
    if edice == '예':
      while True:
        try:
          select = int(input('숫자 몇으로 하겠습니까(1~50)'))
        except:
          print('1~50 중 정수만 가능합니다')
          continue
        if select <= 0 or select > 50:
          print('1~50 중 정수만 가능합니다')
          continue
        break
      inputting = 0
      time.sleep(0.7)
      print(f'다음 이동거리가 {select}이/가 되었습니다')
      time.sleep(0.7)
      edice = 0
    else:
      inputting = 0
      edice = 1
  print('주사위를 굴립니다')
  time.sleep(2)
  num = dice()
  print(f'{num}!')
  time.sleep(1)
  select = -1
  kan()
  print(f'현재 스테이지 {stage}+{num}->{stage + num}')
  stage += num
  time.sleep(1)
  if stage == 444:
    print('')
  if stage >= 400:
    time.sleep(2)
    print('.')
    time.sleep(1)
    print('..')
    time.sleep(1)
    print('...')
    time.sleep(1)
    print()
    print('당신은 지옥을 벗어났습니다')
    time.sleep(1)
    print()
    print('당신의 여정이 마침내 끝을 맞이하였습니다')
    time.sleep(1)
    print()
    print("당신은 게임을 승리하였습니다 (노말 엔딩 '게임승리')")
    time.sleep(1)
    break
  event()
  if rounding == 1:
    print('올림이 적용되었습니다')
    coin = math.ceil(coin)
  if coinm < 0:
    coinm = 0
  if coinp < gambler:
    coinp = gambler
  time.sleep(0.7)
  if dicep == -2:
    print('다리의 고통이 당신의 여정을 방해합니다. (코인-1)')
    coin -= 1
  elif dicep == -3 or dicep == -4:
    print('다리의 강한고통이 당신의 걸음을 막습니다. (코인-2)')
    coin -= 2
  elif dicep <= -5:
    print('불에 타는듯한 고통이 당신의 다리에 전해집니다. (코인-4)')
    coin -= 4
  time.sleep(1.4)
  print('                            코인:{:g}'.format(coin)) # 의미없는 소수점 제거용으로 바꿈 (5.0 --> 5 로 표시)
  print('''                            얻는 코인 증가:{:g}
                            잃는 코인 증가:{:g}
                            주사위 숫자 증감 :{:g}'''.format(coinp, coinm, dicep))
  print(f"                            악세사리:{', '.join(ac) if ac else '없음'}")
  print(f"                            축복:{', '.join(bls) if bls else '없음'}")