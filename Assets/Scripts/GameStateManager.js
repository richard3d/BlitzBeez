#pragma strict
import System.Collections.Generic;
//THIS CLASS IS WACK
var m_ReadySound:AudioClip = null;
var m_ReadySetSound:AudioClip = null;
var m_GoSound:AudioClip = null;
var m_GameSound:AudioClip = null;

static var MATCH_STARTING : int = 0;
static var MATCH_PLAYING : int = 1;
static var MATCH_OVER : int = 2;
static var MATCH_EXITING : int = 3;
static var MATCH_LOBBY : int = 4;

static var m_CurrState:int = -1;
var m_MatchTick : int = 3;
static var m_WinningPlayer : int = -1;
static var m_PointsToWin : int = 800;
function Start()
{
	m_CurrState =-1;
	m_WinningPlayer = -1;
	m_PointsToWin = 800;
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
			ServerRPC.Buffer(GameObject.Find("GameServer").GetComponent(ServerScript).m_SyncMsgsView, "EndMatch", RPCMode.All,  NetworkUtils.GetClientFromGameObject(player));
			return;
		}
	}
}

function SetState(state:int)
{
	m_CurrState = state;
	SendMessage("OnStateChange", state, SendMessageOptions.DontRequireReceiver);
}

@RPC function StartMatchTick(numTicks:int, ticksPerSec:float)
{
	m_WinningPlayer = -1;
	SetState(MATCH_STARTING);
	m_MatchTick = numTicks;
	AudioSource.PlayClipAtPoint(m_ReadySound, Camera.main.transform.position);
	var txt : GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/MatchStartGUI"));
	txt.GetComponent(GUIScript).m_Text = "Ready!";
	txt.GetComponent(GUIScript).m_Depth = -999999;
	Debug.Log("Ticks "+numTicks+" Freq "+ticksPerSec);
	if(Network.isServer)
		MatchTickCoroutine(numTicks, ticksPerSec);
} 

static function CompareWinners(a:GameObject, b:GameObject)
{
	return b.GetComponent(BeeScript).m_Honey.CompareTo(a.GetComponent(BeeScript).m_Honey);
}

@RPC function EndMatch(winner:int)
{

	//give players their scores based on
	var playerList = new List.<GameObject>();
	var players:GameObject[] = GameObject.FindGameObjectsWithTag("Player");
	for(var player:GameObject in players)
	{
		playerList.Add(player);
	}
	
	playerList.Sort(CompareWinners); 
	for(var i:int = 0; i <playerList.Count; i++)
	{
		var beeScript:BeeScript = playerList[i].GetComponent(BeeScript);
		if( i <= 2)
		{
			beeScript.m_MatchPoints = 500- i*200 + Mathf.Max(beeScript.m_Kills - beeScript.m_Deaths, 0)*10 + beeScript.m_LongestChain * 25;
		}
		else
			break;
	}

	var flash:GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/ScreenFlash"));
		// GameObject.Find("Flash").animation.Stop("FlashIntro");
			// GameObject.Find("Flash").animation["FlashIntro"].time = 2.35;
			// GameObject.Find("Flash").animation.Play("FlashIntro");
	flash.transform.position = Vector3(0.5,0.5,1);
	flash.animation.Stop("FlashIntro");
	flash.animation["FlashIntro"].time = 2.35;
	flash.animation.Play("FlashIntro");

	if(GameObject.Find("Music"))
		GameObject.Find("Music").GetComponent(AudioSource).Stop();
	
	//this (MatchStartGUI) is really just a text type with a cool zoom effect
	AudioSource.PlayClipAtPoint(m_GameSound, Camera.main.transform.position);
	var txt : GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/MatchStartGUI"));
	txt.GetComponent(GUIScript).m_Text =  "Game!";
	txt.GetComponent(GUIScript).m_Depth = -999999;

	yield WaitForSeconds(0.1);
	txt   = gameObject.Instantiate(Resources.Load("GameObjects/MatchStartGUI"));
	txt.GetComponent(GUIScript).m_Text =  "Game!";
	txt.GetComponent(GUIScript).m_Depth = -999999;
	
	txt.GetComponent(GUIScript).m_SpawnGUI = Resources.Load("GameObjects/MatchEndGUI");
	txt.GetComponent(GUIScript).m_SpawnGUI.GetComponent(GUIScript).m_Depth = -999;

	yield WaitForSeconds(0.1);
	txt   = gameObject.Instantiate(Resources.Load("GameObjects/MatchStartGUI"));
	txt.GetComponent(GUIScript).m_Text =  "Game!";
	txt.GetComponent(GUIScript).m_Depth = -999999;
	
	
	
	// var gui : GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/MatchEndGUI"));
	// gui.GetComponent(GUIScript).m_Depth = -999;
	
	
	SetState(MATCH_OVER);
	m_WinningPlayer = NetworkUtils.GetClientFromGameObject(playerList[0]);
	
	
}

@RPC function ExitMatch()
{
	SetState(MATCH_LOBBY);
}




function MatchTickCoroutine(numTicks:int, ticksPerSec:float)
{
	while(m_MatchTick >= 0)
	{
		var freq:float = 1.0/ticksPerSec;
		yield WaitForSeconds(freq);
		Debug.Log("Tick" +m_MatchTick);
		DoMatchTick();
		ServerRPC.Buffer(GetComponent(ServerScript).m_SyncMsgsView,"DoMatchTick", RPCMode.Others);
		
		
	}
}

//counts down the ticks till the matchs starts

@RPC private function  DoMatchTick()
{

	
	if(m_MatchTick < 0)
	{
		//m_MatchTick = 0;
		return;
	}
	m_MatchTick--;	
	if(m_MatchTick >= 0)
	{	
		if(m_MatchTick == 0)
			AudioSource.PlayClipAtPoint(m_GoSound, Camera.main.transform.position);
		else
			AudioSource.PlayClipAtPoint(m_ReadySetSound, Camera.main.transform.position);
		
		var txt : GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/MatchStartGUI"));
		txt.GetComponent(GUIScript).m_Text =  m_MatchTick ==0 ? "Go!":" "+m_MatchTick;
		txt.GetComponent(GUIScript).m_Depth = -999999;
		txt.GetComponent(GUIScript).m_Color =  m_MatchTick ==0 ?Color.white:Color.yellow;
		yield WaitForSeconds(0.1);
		txt   = gameObject.Instantiate(Resources.Load("GameObjects/MatchStartGUI"));
		txt.GetComponent(GUIScript).m_Text = m_MatchTick ==0 ? "Go!":" "+m_MatchTick;
		txt.GetComponent(GUIScript).m_Depth = -999999;
		txt.GetComponent(GUIScript).m_Color =  m_MatchTick ==0 ?Color.white:Color.yellow;
		yield WaitForSeconds(0.1);
		txt   = gameObject.Instantiate(Resources.Load("GameObjects/MatchStartGUI"));
		txt.GetComponent(GUIScript).m_Text = m_MatchTick ==0 ? "Go!":" "+m_MatchTick;
		txt.GetComponent(GUIScript).m_Depth = -999999;
		txt.GetComponent(GUIScript).m_Color =  m_MatchTick ==0 ?Color.white:Color.yellow;
	}
	
	if(m_MatchTick == 0)
	{		
		var go:GameObject = GameObject.Instantiate(Resources.Load("GameObjects/ScreenFlash"), Vector3(0.5, 0.5, 0), Quaternion.identity);
		go.animation.Stop("FlashIntro");
		go.animation["FlashIntro"].time = 2.35;
		go.animation.Play("FlashIntro");
		txt.GetComponent(UpdateScript).m_Lifetime = 1.2;
		SetState(MATCH_PLAYING);
		
	}
	
}
