#pragma strict

class GameEventMsg
{
	var m_Lifetime:float = 0;
	var m_Msg:String;
}

static var m_MsgDuration : float = 5;
static var m_MaxDisplayedMsgs : int = 5;
static var m_Msgs : Array =  new Array();

static function QueueMessage(msg:String)
{
	var Msg = new GameEventMsg();
	Msg.m_Msg = msg;
	Msg.m_Lifetime = m_MsgDuration;
	m_Msgs.Add(Msg);
	
	if(m_Msgs.length > m_MaxDisplayedMsgs)
	{
		m_Msgs.Shift();
	}
}

static function DequeueMessage()
{
	
}

function Start () {

	

}

static function DrawMessages(posX:int, posY:int, style:GUIStyle)
{
	var max = Mathf.Min(m_MaxDisplayedMsgs,m_Msgs.length);
	for(var k = 0; k < max; k++)
	{
		var msg : GameEventMsg = m_Msgs[k] as GameEventMsg;
		GUI.color = Color(1,1,1,0.8*Mathf.Min(1,msg.m_Lifetime));
		GUI.Label(Rect(posX,posY-(max-k)*24,512,48), msg.m_Msg,style);
	}
	GUI.color = Color.white;
}

static function ProcessMesages () {

	for(var i = 0; i < m_Msgs.length; i++)
	{
		var msg : GameEventMsg = m_Msgs[i] as GameEventMsg;
		
		if(i < m_MaxDisplayedMsgs)
		{
			msg.m_Lifetime -= Time.deltaTime;
			if(msg.m_Lifetime <= 0)
			{
				m_Msgs.Shift();
			}
		}
	}
}