#pragma strict

var m_Msgs : String[] = null;

function Awake()
{
	
}

function Start () {

}

function Update () {

}

function Print(msg : String)
{
	if(m_Msgs == null)
	{
		m_Msgs = new String[1];
		m_Msgs[0] = msg;
	}
	else
	{
		var vMsgs : Array = new Array(m_Msgs);
		vMsgs.Push(msg);
		m_Msgs = vMsgs.ToBuiltin(String) as String[];
	}
	
	if(m_Msgs.length > 20)
	{
		vMsgs = new Array(m_Msgs);
		vMsgs.Shift();
		m_Msgs = vMsgs.ToBuiltin(String) as String[];
	}
}

function OnGUI()
{
	if(m_Msgs != null)
	{
		for(var i = 0; i < m_Msgs.length; i++)
		{
			GUILayout.Label(m_Msgs[i]);
		}
	}
}