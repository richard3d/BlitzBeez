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

var m_CurrSelIndex : int = 0;
var m_Selection : int[] = new int[6];

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
		
	//	if(Network.isServer && m_Fade >= 1)
		//	networkView.RPC("ShowHiveGUI", RPCMode.All, 0, "Hive");
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
		//GetComponent(BeeControllerScript).m_Stats[m_LvlUpSelections[m_CurrLevel].m_Selections[m_CurrSelIndex].m_StatName] = m_LvlUpSelections[m_CurrLevel].m_Selections[m_CurrSelIndex].m_Value;
		networkView.RPC("Upgrade", RPCMode.All, m_CurrSelIndex);
		//networkView.RPC("Upgrade", RPCMode.All, m_LvlUpSelections[m_CurrLevel].m_Selections[m_CurrSelIndex].m_StatName,m_LvlUpSelections[m_CurrLevel].m_Selections[m_CurrSelIndex].m_Value);
		
		if(Network.isServer )
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
	m_CurrSelIndex = index;
}

//this is only executed on the server
@RPC function ExitHive()
{
	//networkView.RPC("ShowHiveGUI", RPCMode.All, 0, "Hive");
}

@RPC function Upgrade(selIndex:int)
{
	var t:Talent = TalentTree.m_Talents[m_Selection[selIndex]] as Talent;
	for(var key:String in t.m_Stats.Keys)
	{
		var beeCtrlScript:BeeControllerScript = GetComponent(BeeControllerScript);
		if(key == "Loadout" || key == "Powershot")
		{
			beeCtrlScript.m_Stats[key] = t.m_Stats[key];
			beeCtrlScript.m_LoadOut.CreateLoadOut(beeCtrlScript.m_Stats["Loadout"]);
		}
		else
		{
			var val:int = t.m_Stats[key];
			var currVal:int = beeCtrlScript.m_Stats[key];
			beeCtrlScript.m_Stats[key] = (val+currVal);
		}
		//perform powerup specific timer resets etc.
		if(key == "Max_Workers")
			beeCtrlScript.m_WorkerGenTimer = beeCtrlScript.m_WorkerGenTime;
		if(key == "Health")
		{
			var health:int = beeCtrlScript.m_Stats["Health"];
			GetComponent(BeeScript).m_HP = 3.0 + (health+1);
		}
	}
	TalentTree.m_Talents.RemoveAt(m_Selection[selIndex]);
	GetComponent(BeeScript).m_NumUpgradesAvailable--;
}

function Show(bShow : boolean)
{
	m_bShow = bShow;
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		if(m_bShow)
		{
			Screen.showCursor = true;
			Debug.Log("Showing");
			m_CurrSelIndex = 0;
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
}

function OnGUI()
{
	if(m_bShow && NetworkUtils.IsControlledGameObject(gameObject))
	{	
		if(m_Fade < 1 && m_bShow)
		{
			m_Fade += Time.deltaTime * 2;
			Camera.main.orthographicSize -= Time.deltaTime * 90;
		}
		
		
		if(NetworkUtils.IsControlledGameObject(gameObject)) 
		{
			//draw background
			GUI.color = Color(1,1,1,1);
			GUI.DrawTexture(Rect(0,0, Screen.width*m_BGOffset,Screen.height), m_BGTexture);
			GUI.color = Color.white;
			//display directions
			GUI.Label(Rect(0,0, Screen.width,32), "Hold Direction and Press Fire to Make a Selection", m_GUISkin.label);
			
			
			
			//display info for the current selection
			var hexCenterPoint:Vector2 = Vector2(Screen.width*0.25,Screen.height*0.5);
			if(m_CurrSelIndex != -1)
			{	
				var t:Talent = TalentTree.m_Talents[m_Selection[m_CurrSelIndex]] as Talent;
				GUI.Label(Rect(0,Screen.height*0.25, Screen.width,Screen.height*0.5), " ", m_GUISkin.label);
				GUI.Label(Rect(hexCenterPoint.x-64,hexCenterPoint.y-16, 128,32), t.m_Name, m_GUISkin.GetStyle("MenuHeading"));
				GUI.Label(Rect(0,Screen.height-32, Screen.width,32), "", m_GUISkin.label);
				GUI.Label(Rect(Screen.width*0.60+50,Screen.height*0.70, 256,32), t.m_Desc, m_GUISkin.GetStyle("MenuText"));
			}
			
			
			for(var i:int = 0; i < m_Selection.length; i++)
			{
				var offset:Vector3 = Quaternion.AngleAxis(-i*60, Vector3.forward) * Vector3.up;
				offset *= m_HexOffset;
				
				var width:float = 190;
				if(m_CurrSelIndex == i)
					width  += Mathf.Sin(Time.time*8)*10;
				
				GUI.DrawTexture(Rect(hexCenterPoint.x+offset.x-width*0.5,hexCenterPoint.y-offset.y-width*0.5, width,width), m_HexBGTexture);
			}
			var beeCtrlScript:BeeControllerScript = GetComponent(BeeControllerScript);
			 var count = 0;
			 var statsPoint:Vector2 = Vector2(Screen.width*0.60,Screen.height*0.27);
			 for(var s:String in beeCtrlScript.m_Stats.Keys)
			 {
				if(s == "Loadout" || s == "Powershot" || s == "Special_Rounds")
					continue;
					var label = s.Replace("_", " ");
					//label.Replace("_", " ");
				 GUI.Label(Rect(statsPoint.x,statsPoint.y+30*count, 128,30), label, m_GUISkin.GetStyle("DescriptionText"));
				 
				 //draw empty sqaures for the meter
				 for(var p:int = 0; p < 5; p++)
				 {
					GUI.DrawTexture(Rect(statsPoint.x+200+p*27,statsPoint.y+6+30*count, 24,18), GetComponent(BeeScript).ReloadBarTexture, ScaleMode.StretchToFill, true);
				 }
				 
				 //draw the filled in squares for the meter
				 var val:int = beeCtrlScript.m_Stats[s];
				 t = TalentTree.m_Talents[m_Selection[m_CurrSelIndex]] as Talent;
				for(var key:String in t.m_Stats.Keys)
				{
					if(key == s)
					{
						var updatedVal : int = t.m_Stats[key];
						val += updatedVal;
						break;
					}
					
				}
				
				 for(p = 0; p < (val+1); p++)
				 {
					GUI.DrawTexture(Rect(statsPoint.x+200+p*27,statsPoint.y+6+30*count, 24,18), GetComponent(BeeScript).ReloadBarTexture, ScaleMode.StretchToFill, true);
					GUI.DrawTexture(Rect(statsPoint.x+200+p*27,statsPoint.y+6+30*count, 24,18), GetComponent(BeeScript).ReloadBarTexture, ScaleMode.StretchToFill, true);
				 }
				 count++;
			 }
			
			width = 256;
		}
		
		
	}
}