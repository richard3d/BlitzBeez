#pragma strict
 
var m_ControlEnabled : boolean = true;
var m_SeqCounter:int = 0; //the sequence counter for this packet 
var m_PrevMousePos : Vector3 = Vector3(0,0,0);
var m_CurrentActions : int = 0; 	 //current actions that were pressed in this frame
var m_PrevActions : int = 0;    	 //previous actions
var m_BuffActions : int = 0;		 //the previous, previous actions
var m_CurrInputState : InputState;   //the entire current input snapshot
var m_InputStateBuffer: Array = new Array();
var m_InputRecordingBuffer: Array = new Array();	//the buffer that records the user's input and that is played back by the server

var m_PlaybackInput:boolean = false;
var m_RecordingInput:boolean = false;
var m_ShowOnce:boolean = false;

private var m_RPCFired : boolean = false;
var m_CursorTexture:Texture2D;
var m_CursorPosition:Vector3;
var m_CursorScreenPosition:Vector3;
var m_CursorDist:float = 100;
var m_ClientOwner : int = -1;

class InputState
{
	static var MOVE_LEFT : int = 1;
	static var MOVE_RIGHT : int = 2;
	static var MOVE_UP : int = 4;
	static var MOVE_BACK : int = 8;
	static var DASH : int = 16;
	static var SHOOT : int = 32;
	static var USE : int = 64;
	static var RELOAD : int = 128;
	
	var m_Sequence:int = 0;
	var m_Timestamp:float = 0;
	var m_CurrentActions : int = 0;
	var m_PrevActions : int = 0;
	var m_BuffActions : int = 0;
	
	
	function GetAction(action : int) : boolean
	{
		var Input : boolean = (this.m_CurrentActions & action) == action ? true : false;
		return Input;
	}

	function GetActionBuffered(action : int) : boolean
	{
		var Input : boolean = ((this.m_CurrentActions & action) == action) && 
							   (this.m_PrevActions & action) != action ;
		return Input;
	}
	
	function GetActionUpBuffered(action : int) : boolean
	{
		//Debug.Log("currAction "+this.m_CurrentActions+ " prevAction "+m_PrevActions+ " desiredAction "+action);
		
		var Input : boolean = ((this.m_CurrentActions & action) != action) && 
							   (this.m_PrevActions & action) == action ;
		return Input;
	}
} 
 
function Awake()
{
	m_ShowOnce = true;
	m_InputRecordingBuffer = new Array();
}

function Start () {
	Screen.showCursor = false;
	//m_CursorPosition = gameObject.transform.position + gameObject.transform.forward * 10;
}

function OnGUI()
{ 
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		//GUI.color = renderer.material.color;
		var scale:float = 26+2*Mathf.Sin(Time.time*16);
		GUI.DrawTexture(Rect(m_CursorScreenPosition.x-scale*0.5,Screen.height-m_CursorScreenPosition.y-scale*0.5,scale,scale), m_CursorTexture);
		//GUI.color = Color.white;
	}
}

function Update () {
	
	
	//if(Network.isClient && !m_ControlEnabled)
	//	return;
	
	if(Network.isServer)
	{
		if(!m_RPCFired)
		{
			if(m_RecordingInput)
			{
				var rec = new InputState();
				rec.m_CurrentActions = m_CurrInputState.m_CurrentActions;
				rec.m_PrevActions = m_CurrInputState.m_PrevActions;
				rec.m_BuffActions = m_CurrInputState.m_BuffActions;
				rec.m_Timestamp = Time.time;
				m_InputRecordingBuffer.Push(rec);
				Debug.Log("Rec Input: "+rec.m_CurrentActions +", "+rec.m_PrevActions+", "+rec.m_BuffActions);
			}
			
			if(!m_PlaybackInput)
			{
				SendMessage("OnNetworkInput", m_CurrInputState, SendMessageOptions.DontRequireReceiver);
				if(m_ShowOnce)
				{
					m_ShowOnce = false;
					
				}
			}
		}
		m_RPCFired = false;
		if(m_PlaybackInput)
		{
			PlaybackInput();	
		}
	
		//we need to still get input if we are the server client
		if(m_ClientOwner != 0)
			return;
	}
	
	
	
	if(Network.connections.Length < 1 && !Network.isServer)
		return;
	
	
	//clear out old input, and remember previous
	m_BuffActions = m_PrevActions;
	m_PrevActions = m_CurrentActions;
	m_CurrentActions = 0;
	
	//handle movement keys
	if(Input.GetAxis("Move Forward/Back") > 0)
	{
		m_CurrentActions |= InputState.MOVE_UP;
	}
	
	if(Input.GetAxis("Move Forward/Back") < 0)
	{
		m_CurrentActions |= InputState.MOVE_BACK;
	}
	
	if(Input.GetAxis("Strafe Left/Right") > 0)
	{
		m_CurrentActions |= InputState.MOVE_RIGHT;
	}
	
	if(Input.GetAxis("Strafe Left/Right") < 0)
	{
		m_CurrentActions |= InputState.MOVE_LEFT;
	}
	//handle look direction
	if(Camera.main.GetComponent(CameraScript) != null &&
	   Camera.main.GetComponent(CameraScript).m_Target != null)
	{
		//NEW
		// var delta:Vector3;
		// if(m_PrevMousePos == Vector3.zero)
			// delta = Vector3.zero;
		// else
			// delta= (Input.mousePosition - m_PrevMousePos);
		
		// m_CursorPosition += (delta.x * gameObject.transform.right + delta.y * gameObject.transform.forward); 
		// m_CursorPosition.y = transform.position.y;
		
		// m_PrevMousePos = Input.mousePosition;
		// var LookDiff:Vector3 = m_CursorPosition - transform.position;
		// m_CursorPosition = transform.position +LookDiff.normalized* 100; 
		// m_CursorScreenPosition = Camera.main.WorldToScreenPoint(m_CursorPosition);
		//END NEW
		
		//ORIGINAL
		var LookDiff :Vector3 = transform.forward;
		LookDiff =  Quaternion.AngleAxis(Input.GetAxis("Look Left/Right")*10, Vector3.up)*LookDiff;
		m_CursorDist += Input.GetAxis("Look Up/Down")*15;
		m_CursorDist = Mathf.Max(10,Mathf.Min(m_CursorDist, 200));
		// var vPos : Vector3 = Camera.main.GetComponent(CameraScript).m_Target.transform.position;
		// var LookDiff = Input.mousePosition-Camera.main.WorldToScreenPoint(vPos);
		// if(LookDiff.y < 0)
			// LookDiff.y *=-1;
		// LookDiff.z = LookDiff.y;
		//LookDiff.y = 0;
		LookDiff.Normalize();
		////var client : ClientScript = GameObject.Find("GameClient").GetComponent(ClientScript) as ClientScript;
		////make this happen on the client immediately, any fixes will come from the server via the RPC
		//END ORIG
							//Vector3(transform.position.x,0,transform.position.y)
		m_CursorPosition = transform.position + transform.forward * m_CursorDist;
		m_CursorScreenPosition = Camera.main.WorldToScreenPoint(m_CursorPosition);
		if(GetComponent(BeeControllerScript).m_LookEnabled)
		{
			if(NetworkUtils.IsControlledGameObject(gameObject))
				Camera.main.GetComponent(CameraScript).m_Target.transform.LookAt(transform.position + LookDiff);
			
			if(m_ClientOwner != 0)
			{
				networkView.RPC("PlayerLookat", RPCMode.Server, m_ClientOwner,   LookDiff);
			}
			else
			{
				PlayerLookat(0,  LookDiff);
			}
		}
	}
	 // Debug.Log(Input.GetAxis ("Horizontal"));
	 // var lookDiff = Vector3(Input.GetAxis ("Horizontal"),0, Input.GetAxis ("Vertical"));
	 // Camera.main.GetComponent(CameraScript).m_Target.transform.LookAt(transform.position + lookDiff);
	
	//handle dash button
	if(Input.GetAxis("Dash") > 0)
	{
		m_CurrentActions |= InputState.DASH;
	}
	
	//handle shooting actions
	if(Input.GetAxis("Shoot") > 0)
	{
		m_CurrentActions |= InputState.SHOOT;
	}
	
	
	//handle recording request from client. NOTE: Remove before final version of game
	// if(Input.GetKeyDown(KeyCode.R))
	// {
		// if(m_ClientOwner != 0)
		// {
			// networkView.RPC("RecordInput", RPCMode.Server);
		// }
		// else
		// {
			// RecordInput();
		// }
	// }
	
	// if(Input.GetKeyDown(KeyCode.P))
	// {
		// if(m_ClientOwner != 0)
		// {
			// networkView.RPC("StartInputPlayback", RPCMode.Server);
		// }
		// else
		// {
		
			// StartInputPlayback();
		// }
	// }
	
	//handle use action
	if(Input.GetAxis("Reload") > 0)
	{
	
		m_CurrentActions |= InputState.RELOAD;
	}
	
	//handle use action
	if(Input.GetAxis("Use Item/Interact") > 0)
	{
		m_CurrentActions |= InputState.USE;
	}
	
	
	
	
	//m_CurrInputState.m_Sequence = m_SeqCounter;
	m_CurrInputState.m_CurrentActions = m_CurrentActions;
	m_CurrInputState.m_PrevActions = m_PrevActions;
	m_CurrInputState.m_BuffActions = m_BuffActions;
	
	//m_InputStateBuffer.Push(m_CurrInputState);
	
	//only send the RPC if there is new data
	if( m_CurrentActions != m_PrevActions || m_PrevActions != m_BuffActions )
	{
		m_CurrInputState.m_Sequence = m_SeqCounter;
		//m_InputStateBuffer.Push(m_CurrInputState);
		
		if(m_ClientOwner != 0)
		{
			//SendMessage("OnNetworkInput", m_CurrInputState, SendMessageOptions.DontRequireReceiver);
			networkView.RPC("PlayerInputEvent", RPCMode.Server, m_ClientOwner,m_SeqCounter, m_CurrentActions, m_PrevActions, m_BuffActions);
		}
		else
		{
			PlayerInputEvent(0, m_SeqCounter, m_CurrentActions, m_PrevActions, m_BuffActions);
		}
		m_SeqCounter++;
	}
	
}

@RPC function AckInput(clientID : int, seq : int)
{
	Debug.Log("Seq "+seq+ " length "+m_InputStateBuffer.length);
	if(m_ClientOwner != clientID)
	{
		return;
	}
	
	
	//iterate from seq counter and execute all actions
	for(var i:int = 0; i < m_InputStateBuffer.length; i++)
	{
		var input:InputState = m_InputStateBuffer[i] as InputState;
		if(input.m_Sequence >= seq)
		{
			
			SendMessage("OnNetworkInput", input, SendMessageOptions.DontRequireReceiver);
		}
	}
	
	m_InputStateBuffer.Shift();
	// for(i = 0; i < seq+1; i++)
	// {
		// if(m_InputStateBuffer.length > 1)
			
		// else
			// m_InputStateBuffer.Clear();
	// }
	//m_SeqCounter = 0;
}


@RPC function PlayerInputEvent(clientID : int, seq : int, actions : int, prevActions : int, buffActions : int)
{
	//no need to do anythign if we are the client, its the server who should be handling the calls	
	if(Network.isClient)
		return;
	
	if(clientID == -1)
	{
		//Debug.Log("Input Failed: ClientID is invalid");
		return;
	}
	
	var client : ClientNetworkInfo = gameObject.Find("GameServer").GetComponent(ServerScript).GetClient(clientID);
	if(	client.m_GameObject == null)
	{
		//Debug.Log("Input Failed: Client GameObject is null");
		return;
	}
	
	if(m_ClientOwner != clientID)
	{
		return;
	}
	
	
	//this must be called before update input
	var input : InputState = new InputState();
	input.m_CurrentActions = actions;
	input.m_PrevActions = prevActions;
	input.m_BuffActions = buffActions;
	input.m_Timestamp = Time.time;
	
	m_CurrentActions = actions;
	m_PrevActions = prevActions;
	m_BuffActions = buffActions;
	
	m_CurrInputState = input;
	
	
	if(m_RecordingInput)
	{
		var rec = new InputState();
		rec.m_CurrentActions = actions;
		rec.m_PrevActions = prevActions;
		rec.m_BuffActions = buffActions;
		rec.m_Timestamp = Time.time;
		m_InputRecordingBuffer.Push(rec);
		var inp:InputState = m_InputRecordingBuffer[m_InputRecordingBuffer.length-1] as InputState;
		Debug.Log(m_InputRecordingBuffer.length+" Recorded Input: "+inp.m_CurrentActions +", "+inp.m_PrevActions+", "+inp.m_BuffActions);
		
	}

	m_RPCFired = true;
	m_ShowOnce = true;
	//if(m_ControlEnabled)
		SendMessage("OnNetworkInput", input, SendMessageOptions.DontRequireReceiver);	
	
	
	//acknowledge the input to the client
	//networkView.RPC("AckInput", RPCMode.All, clientID,seq);
	
}



@RPC function PlayerLookat(clientID : int, lookPt : Vector3)
{
	//no need to do anythign if we are the client, its the server who should be handling the calls
	if(Network.isClient )
		return;
		
	if(clientID == -1)
	{
		//Debug.Log("Input Failed: ClientID is invalid");
		return;
	}
	var client : ClientNetworkInfo = gameObject.Find("GameServer").GetComponent(ServerScript).GetClient(clientID);
	if(	client.m_GameObject == null)
	{
		//Debug.Log("Input Failed: Client GameObject is null");
		return;
	}
	if(m_ClientOwner != clientID)
	{
		return;
	}
	
	
	//var vPos : Vector3 = client.m_GameObject.transform.position;
	//client.m_GameObject.transform.LookAt(vPos + lookPt);
	SendMessage("OnPlayerLookAt", lookPt, SendMessageOptions.DontRequireReceiver);
}

@RPC function RecordInput()
{
	m_RecordingInput = !m_RecordingInput;
	Debug.Log("Record: "+m_RecordingInput);
	
}

@RPC function StartInputPlayback()
{
	m_RecordingInput = false;
	m_PlaybackInput = true;
	Debug.Log("Playing");
	var ip:InputState = m_InputRecordingBuffer[0] as InputState;
	Debug.Log(m_InputRecordingBuffer.length+" Playback Input1: "+ip.m_CurrentActions +", "+ip.m_PrevActions+", "+ip.m_BuffActions);
	SendMessage("OnNetworkInput", ip, SendMessageOptions.DontRequireReceiver);
	
}

private function PlaybackInput()
{
	if(m_InputRecordingBuffer.length > 1)
	{
		
		var inp:InputState = m_InputRecordingBuffer[0] as InputState;
		var inp2:InputState = m_InputRecordingBuffer[1] as InputState;
		
		if(inp.m_Timestamp + Time.deltaTime < inp2.m_Timestamp)
		{
			inp.m_Timestamp += Time.deltaTime;
		}
		else
		{
			//var front:InputState = m_InputRecordingBuffer.Shift() as InputState;
			m_InputRecordingBuffer.Shift();
			var front:InputState = m_InputRecordingBuffer[0] as InputState;
			Debug.Log("Playback Input: "+front.m_CurrentActions +", "+front.m_PrevActions+", "+front.m_BuffActions);
			SendMessage("OnNetworkInput", front, SendMessageOptions.DontRequireReceiver);
		}
			
	}
	else if(m_InputRecordingBuffer.length == 1)
	{
		m_InputRecordingBuffer.Clear();
		m_PlaybackInput = false;
		Debug.Log("Done Playing");
	}
}
