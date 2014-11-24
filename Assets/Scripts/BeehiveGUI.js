#pragma strict

var m_GUISkin : GUISkin = null;
var m_BGTexture : Texture2D = null;
var m_HexBGTexture : Texture2D = null;
var m_HexOffset:float = 0; 
var m_BGOffset:float = 0; 
var m_bShow : boolean = false;
private var m_Fade : float = 0;


class Selection
{
	var m_StatName:String;
	var m_DisplayName:String;
	var m_Description:String;
	var m_Value : int;
}

class SelectionArray
{
	var m_Selections:Selection[];
}

var m_LvlUpSelections : SelectionArray[];
var m_MainSelIndex : int = 0;


function Start () {
	
	//set appropriate styles
	
	 
	 //register event listeners
	
}

function Update () {
	
	
	 if(!m_bShow)
		 return;
	
	if(Input.GetAxis("Use Item/Interact"))
	{
	
	}
	
	//if the user clicks off the menu( there is no valid sel index );
	if (Input.GetMouseButtonDown(0))
	{
		//hide the menu
		
	}
}

function OnNetworkInput(IN : InputState)
{

	if(!networkView.isMine)
	{
		return;
	}
	
	if(IN.GetActionBuffered(IN.USE))
	{
		
		if(Network.isServer && m_Fade >= 1)
			networkView.RPC("ShowHiveGUI", RPCMode.All, 0, "Hive");
			// ExitHive();
		// else
			// networkView.RPC("ExitHive", RPCMode.Server);
			// networkView.RPC("ShowHiveGUI", RPCMode.All, 0, "Hive");
	}
	
	if(!m_bShow)
		return;
	if(IN.GetActionBuffered(IN.SHOOT))
	{
		var m_CurrLevel = GetComponent(BeeScript).m_CurrLevel-1;
		//GetComponent(BeeControllerScript).m_Stats[m_LvlUpSelections[m_CurrLevel].m_Selections[m_MainSelIndex].m_StatName] = m_LvlUpSelections[m_CurrLevel].m_Selections[m_MainSelIndex].m_Value;
		
		networkView.RPC("Upgrade", RPCMode.All, m_LvlUpSelections[m_CurrLevel].m_Selections[m_MainSelIndex].m_StatName,m_LvlUpSelections[m_CurrLevel].m_Selections[m_MainSelIndex].m_Value);
		
		if(Network.isServer && m_Fade >= 1)
			networkView.RPC("ShowHiveGUI", RPCMode.All, 0, "Hive");
	}
	
	if(IN.GetAction(IN.MOVE_UP) && IN.GetAction(IN.MOVE_LEFT))
	{
		networkView.RPC("SetSelectionIndex",RPCMode.All, 5);
	}
	else if(IN.GetAction(IN.MOVE_UP)&& IN.GetAction(IN.MOVE_RIGHT))
	{
		networkView.RPC("SetSelectionIndex",RPCMode.All, 1);
	}
	else if(IN.GetAction(IN.MOVE_UP))
	{
		networkView.RPC("SetSelectionIndex",RPCMode.All, 0);
	}
	else if(IN.GetAction(IN.MOVE_BACK) && IN.GetAction(IN.MOVE_LEFT))
	{
		networkView.RPC("SetSelectionIndex",RPCMode.All, 4);
	}
	else if(IN.GetAction(IN.MOVE_BACK) && IN.GetAction(IN.MOVE_RIGHT))
	{
		networkView.RPC("SetSelectionIndex",RPCMode.All, 2);
	}
	else if(IN.GetAction(IN.MOVE_BACK))
	{
		networkView.RPC("SetSelectionIndex",RPCMode.All, 3);
	}
}

@RPC function SetSelectionIndex(index:int)
{
	m_MainSelIndex = index;
}

//this is only executed on the server
@RPC function ExitHive()
{
	//networkView.RPC("ShowHiveGUI", RPCMode.All, 0, "Hive");
}

@RPC function Upgrade(attr:String, val:int)
{
	//if there is a valid sub selection index add 1 to it, to bias it for multiplication with the item index
	GetComponent(BeeControllerScript).m_Stats[attr] = val;
	
	if(attr == "Max Workers")
		GetComponent(BeeControllerScript).m_WorkerGenTimer = GetComponent(BeeControllerScript).m_WorkerGenTime;
	
	GetComponent(BeeScript).m_NumUpgradesAvailable--;
}

function Show(bShow : boolean)
{
	m_bShow = bShow;
	
	if(m_bShow)
	{
		Screen.showCursor = true;
		Debug.Log("Showing");
		m_MainSelIndex = 0;
		animation["BeeGUIOpen"].time = 0;
		animation["BeeGUIOpen"].speed = 1;
		animation.Play("BeeGUIOpen");
		
		Camera.main.animation["CameraDramaticZoom"].speed = 1;
		Camera.main.animation.Play("CameraDramaticZoom");
		//m_CurrSelMenu.Push(m_MainMenu);
		//m_MainMenu.m_MenuItems[0].m_Color = Color.yellow;
	}
	else
	{
		Screen.showCursor = false;
		
		m_Fade = 0;
		Camera.main.orthographicSize = 100;
		
		Debug.Log("Hiding");
		
		//hide the menu
		animation["BeeGUIOpen"].speed = -1;
		animation["BeeGUIOpen"].time = animation["BeeGUIOpen"].length;
		animation.Play("BeeGUIOpen");
		
		Camera.main.animation["CameraDramaticZoom"].time = Camera.main.animation["CameraDramaticZoom"].length;
		Camera.main.animation["CameraDramaticZoom"].speed = -1;
		Camera.main.animation.Play("CameraDramaticZoom");
		
	}
}

function OnGUI()
{
	if(m_bShow)
	{	
		if(m_Fade < 1 && m_bShow)
		{
			m_Fade += Time.deltaTime * 2;
			Camera.main.orthographicSize -= Time.deltaTime * 90;
		}
		
		
		if(NetworkUtils.IsControlledGameObject(gameObject)) 
		{
			//draw background
			GUI.color = Color(1,1,1,0.5);
			GUI.DrawTexture(Rect(0,0, Screen.width*m_BGOffset,Screen.height), m_BGTexture);
			GUI.color = Color.white;
			//display directions
			GUI.Label(Rect(0,0, Screen.width,32), "Hold Direction and Press Fire to Make a Selection", m_GUISkin.label);
			
			var m_CurrLevel = GetComponent(BeeScript).m_CurrLevel-1;
			//display info for the current selection
			if(m_MainSelIndex != -1)
			{	
				GUI.Label(Rect(0,Screen.height*0.25, Screen.width,Screen.height*0.5), m_LvlUpSelections[m_CurrLevel].m_Selections[m_MainSelIndex].m_DisplayName, m_GUISkin.label);
				GUI.Label(Rect(0,Screen.height-32, Screen.width,32), m_LvlUpSelections[m_CurrLevel].m_Selections[m_MainSelIndex].m_Description, m_GUISkin.label);
			}
			
			for(var i:int = 0; i < 6; i++)
			{
				var offset:Vector3 = Quaternion.AngleAxis(-i*60, Vector3.forward) * Vector3.up;
				offset *= m_HexOffset;
				
				var width:float = 190;
				if(m_MainSelIndex == i)
					width  += Mathf.Sin(Time.time*8)*10;
				
				GUI.DrawTexture(Rect(Screen.width*0.5+offset.x-width*0.5,Screen.height*0.5-offset.y-width*0.5, width,width), m_HexBGTexture);
			}
			
			width = 256;

			
		}
		
		
	}
}