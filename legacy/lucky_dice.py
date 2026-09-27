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