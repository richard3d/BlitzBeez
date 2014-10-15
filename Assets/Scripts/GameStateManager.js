#pragma strict
//THIS CLASS IS WACK
//a number to count down for match start (or can be used for reay set go etc).


static var MATCH_STARTING : int = 0;
static var MATCH_PLAYING : int = 1;
static var MATCH_OVER : int = 2;
static var MATCH_EXITING : int = 3;
static var MATCH_LOBBY : int = 4;

static var m_CurrState:int = -1;
var m_MatchTick : int = 3;
static var m_WinningPlayer : int = -1;
static var m_PointsToWin : int = 200;
function Start()
{
	m_CurrState =-1;
	m_WinningPlayer = -1;
	m_PointsToWin = 200;
}

function Update()
{
}

static function CheckForWin()
{
	var players : GameObject[] = GameObject.FindGameObjectsWithTag("Player");
	for(var player:GameObject in players)
	{
		if(player.GetComponent(BeeScript).m_Honey >= m_PointsToWin)
		{
			ServerRPC.Buffer(GameObject.Find("GameServer").networkView, "EndMatch", RPCMode.All,  NetworkUtils.GetClientFromGameObject(player));
			return;
		}
	}
}

function SetState(state:int)
{
	m_CurrState = state;
	SendMessage("OnStateChange", state, SendMessageOptions.DontRequireReceiver);
}

@RPC function StartMatchTick(numTicks:int, ticksPerSec:int)
{
	m_WinningPlayer = -1;
	SetState(MATCH_STARTING);
	m_MatchTick = numTicks;
	if(Network.isServer)
		yield MatchTickCoroutine(numTicks, ticksPerSec);
} 

@RPC function EndMatch(winner:int)
{
	SetState(MATCH_OVER);
	m_WinningPlayer = winner;
}

@RPC function ExitMatch()
{
	SetState(MATCH_LOBBY);
}




function MatchTickCoroutine(numTicks:int, ticksPerSec:int)
{
	while(m_MatchTick >= 0)
	{
		var freq:float = 1.0/ticksPerSec;
		yield WaitForSeconds(freq);
		DoMatchTick();
		ServerRPC.Buffer(GetComponent(ServerScript).m_SyncMsgsView,"DoMatchTick", RPCMode.Others);
		
		
	}
}

//counts down the ticks till the matchs starts

@RPC private function  DoMatchTick()
{
	m_MatchTick--;
	if(m_MatchTick == 0)
	{		
		SetState(MATCH_PLAYING);
	}
	
}
