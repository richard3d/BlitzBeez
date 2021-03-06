#pragma strict

var m_GUISkin : GUISkin = null;
var m_MenuSelectSound:AudioClip = null;
var m_MenuSound:AudioClip = null;
var m_MenuShow:AudioClip = null;
var m_MenuHide:AudioClip = null;
var m_BGTexture : Texture2D = null;
var m_HexBGTexture : Texture2D = null;
var m_TalentIcons:Texture2D[] = null;
private var m_Coin : GameObject = null;	//just an imposter for the HUD


var m_HexOffset:float = 0; 
var m_BGOffset:float = 0; 
var m_bShow : boolean = false;

private var m_Fade : float = 0;
private var m_Camera:GameObject = null;

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
	if(GetComponent(BeeScript) != null)
	{
		m_Camera = GetComponent(BeeScript).m_Camera;
		if(m_Camera)
		{
			if(m_Camera.GetComponent.<Camera>().rect.height < 1)
			{
				m_GUISkin.GetStyle("MenuText").fontSize = 18; 
				m_GUISkin.GetStyle("DescriptionText").fontSize = 18;
			}
			else
			{
				m_GUISkin.GetStyle("MenuText").fontSize = 24;
				m_GUISkin.GetStyle("DescriptionText").fontSize = 24;
			}
		}
	}

	
}

function OnDisable()
{
	if(m_Coin)
				Destroy(m_Coin);
}

function Update () {
	
	
	 if(!m_bShow)
		 return;
	var joyStr:String = "Joy"+GetComponent(NetworkInputScript).m_ClientOwner+" ";
	// if(Input.GetAxis(joyStr+"Use Item/Interact"))
	// {
	
	// }
	
	// //if the user clicks off the menu( there is no valid sel index );
	// if (Input.GetMouseButtonDown(0))
	// {
		// //hide the menu
		
	// }
}

function OnNetworkInput(IN : InputState)
{
	if(!GetComponent.<NetworkView>().isMine)
	{
		return;
	}
	
	
	
	if(!m_bShow)
		return;
	if(IN.GetActionBuffered(IN.SHOOT))
	{
		var m_CurrLevel = GetComponent(BeeScript).m_CurrLevel-1;
		//GetComponent(BeeControllerScript).m_Stats[m_LvlUpSelections[m_CurrLevel].m_Selections[m_CurrSelIndex].m_StatName] = m_LvlUpSelections[m_CurrLevel].m_Selections[m_CurrSelIndex].m_Value;
		var t:Talent = TalentTree.m_Talents[m_Selection[m_CurrSelIndex]] as Talent;
		if(t.m_Cost <= GetComponent(BeeScript).m_NumUpgradesAvailable)
		{
			GetComponent.<NetworkView>().RPC("Upgrade", RPCMode.All, m_CurrSelIndex);
			//networkView.RPC("Upgrade", RPCMode.All, m_LvlUpSelections[m_CurrLevel].m_Selections[m_CurrSelIndex].m_StatName,m_LvlUpSelections[m_CurrLevel].m_Selections[m_CurrSelIndex].m_Value);
			//if(Network.isServer )
			//	networkView.RPC("ShowHiveGUI", RPCMode.All, 0);
		}
		
	}
	
	if(IN.GetActionBuffered(IN.USE))
	{
		if(Network.isServer )
				GetComponent.<NetworkView>().RPC("ShowHiveGUI", RPCMode.All, 0);
	}
	
	if(IN.GetAction(IN.MOVE_UP) && IN.GetAction(IN.MOVE_LEFT))
	{
		GetComponent.<NetworkView>().RPC("SetSelectionIndex",RPCMode.All, 5);
	}
	else if(IN.GetAction(IN.MOVE_UP)&& IN.GetAction(IN.MOVE_RIGHT))
	{
		GetComponent.<NetworkView>().RPC("SetSelectionIndex",RPCMode.All, 1);
	}
	else if(IN.GetAction(IN.MOVE_UP))
	{
		GetComponent.<NetworkView>().RPC("SetSelectionIndex",RPCMode.All, 0);
	}
	else if(IN.GetAction(IN.MOVE_BACK) && IN.GetAction(IN.MOVE_LEFT))
	{
		GetComponent.<NetworkView>().RPC("SetSelectionIndex",RPCMode.All, 4);
	}
	else if(IN.GetAction(IN.MOVE_BACK) && IN.GetAction(IN.MOVE_RIGHT))
	{
		GetComponent.<NetworkView>().RPC("SetSelectionIndex",RPCMode.All, 2);
	}
	else if(IN.GetAction(IN.MOVE_BACK))
	{
		GetComponent.<NetworkView>().RPC("SetSelectionIndex",RPCMode.All, 3);
	}
}

@RPC function SetSelectionIndex(index:int)
{
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		if(m_CurrSelIndex != index)
			AudioSource.PlayClipAtPoint(m_MenuSelectSound, Camera.main.transform.position);		
	}
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
	if(t.m_Cost > GetComponent(BeeScript).m_NumUpgradesAvailable)
		return;
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
	
	
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		AudioSource.PlayClipAtPoint(m_MenuSound, Camera.main.transform.position);		
	}
	
	TalentTree.m_Talents.RemoveAt(m_Selection[selIndex]);
	GetComponent(BeeScript).m_NumUpgradesAvailable--;
}

function FindIcon(name:String) : Texture2D
{
	for(var tex:Texture2D in m_TalentIcons)
	{
		if(tex != null && tex.name == name)
			return tex;
	}
	return null;
}

function Show(bShow : boolean)
{
	m_bShow = bShow;
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		if(m_bShow)
		{
			Cursor.visible = true;
			Debug.Log("Showing");
			m_CurrSelIndex = 0;
			GetComponent.<Animation>()["BeeGUIOpen"].time = 0;
			GetComponent.<Animation>()["BeeGUIOpen"].speed = 1;
			GetComponent.<Animation>().Play("BeeGUIOpen");
			m_Camera.GetComponent(CameraScript).m_DefaultOffset = Vector3(5,10,48);
			m_Camera.GetComponent(CameraScript).m_FocalOffset.x = -10;
		//	m_Camera.GetComponent(DepthOfFieldScatter).enabled = true;
		//	m_Camera.GetComponent(DepthOfFieldScatter).focalLength = 42.5;
			m_Camera.GetComponent(DepthOfFieldScatter).aperture = 18;
			
			transform.Find("Bee").localEulerAngles.z = 0;
			m_Camera.GetComponent(CameraScript).m_CamPos = transform.position;
			m_Camera.GetComponent(CameraScript).Snap();
		
			transform.Find("Bee/NewBee").GetComponent.<Animation>().Play("idle");
			GetComponent(BeeScript).SetGUIEnabled(false);
			AudioSource.PlayClipAtPoint(m_MenuShow, Camera.main.transform.position);	

			m_Coin = GameObject.Instantiate(Resources.Load("GameObjects/CoinImposter"));	
			Debug.Log("cam "+m_Camera.GetComponent.<Camera>().pixelRect);
			var camWidth = m_Camera.GetComponent.<Camera>().rect.width;
			var camScale = m_Camera.GetComponent.<Camera>().rect.width;
			var camPos:Vector2 = Vector2(m_Camera.GetComponent.<Camera>().rect.x*Screen.width,Mathf.Abs(m_Camera.GetComponent.<Camera>().rect.y - 0.5)*Screen.height);
			
			if(m_Camera.GetComponent.<Camera>().rect.y == 0.0 &&  m_Camera.GetComponent.<Camera>().rect.height == 1)
				camPos.y = 0;
				
			var bottom:float = camPos.y +m_Camera.GetComponent.<Camera>().rect.height*Screen.height;
			var right:float = camPos.x + Screen.width* m_Camera.GetComponent.<Camera>().rect.width;
			m_Coin.GetComponent(GUIScript).SetPixelRect(Rect(m_Camera.GetComponent.<Camera>().pixelRect.x,bottom - 64,64,64));
			var h  =64;// m_Coin.transform.GetChild(0).GetComponent(GUIScript).m_Style.fontSize;
			//m_Coin.transform.GetChild(0).GetComponent(GUIScript).SetPixelRect(Rect(m_Camera.GetComponent.<Camera>().pixelRect.x+68,bottom - 64,200, h));
			//m_Coin.transform.GetChild(1).GetComponent(GUIScript).SetPixelRect(Rect(m_Camera.GetComponent.<Camera>().pixelRect.x+66,bottom - 62,200, h));			
			m_Coin.transform.GetChild(0).GetComponent(GUIScript).m_Style.alignment = TextAnchor.MiddleLeft;
			m_Coin.transform.GetChild(1).GetComponent(GUIScript).m_Style.alignment = TextAnchor.MiddleLeft;
			
	
		}
		else
		{
			
			
			Cursor.visible = false;
			m_Fade = 0;
			
			//hide the menu
			GetComponent.<Animation>()["BeeGUIOpen"].speed = -1;
			GetComponent.<Animation>()["BeeGUIOpen"].time = GetComponent.<Animation>()["BeeGUIOpen"].length;
			GetComponent.<Animation>().Play("BeeGUIOpen");
			
			m_Camera.GetComponent(CameraScript).m_DefaultOffset = Vector3(0,20,-60);
			m_Camera.GetComponent(CameraScript).m_FocalOffset.x = 0;
			m_Camera.GetComponent(DepthOfFieldScatter).enabled = false;
			GetComponent(BeeScript).SetGUIEnabled(true);
			transform.Find("Bee/NewBee").GetComponent.<Animation>().Play("fly");
			AudioSource.PlayClipAtPoint(m_MenuHide, Camera.main.transform.position);
			
			if(m_Coin)
				Destroy(m_Coin);
			
			if(GetComponent(RespawnDecorator) != null)
			{
				GetComponent(RespawnDecorator).RespawnPlayer();
			}
			
		}
	}
}

function OnGUI()
{
	if(m_bShow && NetworkUtils.IsLocalGameObject(gameObject))
	{	
		if(m_Fade < 1 && m_bShow)
		{
			m_Fade += Time.deltaTime * 2;
			m_Camera.GetComponent.<Camera>().orthographicSize -= Time.deltaTime * 90;
		}
		
		
		if(NetworkUtils.IsLocalGameObject(gameObject)) 
		{
			var camScaleX  = m_Camera.GetComponent.<Camera>().rect.width;
			var camScaleY  = m_Camera.GetComponent.<Camera>().rect.height;
		
			var camWidth = m_Camera.GetComponent.<Camera>().rect.width*Screen.width;
			var camHeight = m_Camera.GetComponent.<Camera>().rect.height*Screen.height;
			var camPos:Vector2 = Vector2(m_Camera.GetComponent.<Camera>().rect.x*Screen.width,Mathf.Abs(1.0-(m_Camera.GetComponent.<Camera>().rect.y+m_Camera.GetComponent.<Camera>().rect.height) )*Screen.height);
			
			var camBottom:float = camPos.y +m_Camera.GetComponent.<Camera>().rect.height*Screen.height;
			//var right:float = camPos.x + Screen.width* m_Camera.camera.rect.width;
			//var camPixWidth = m_Camera.camera.rect.width*
			//draw background
			GUI.color = Color(1,1,1,1);
			//GUI.DrawTexture(Rect(camPos.x,camPos.y, camWidth*m_BGOffset ,camHeight), m_BGTexture);
			GUI.color = Color.white;
			//display directions
			//GUI.Label(Rect(camPos.x,camPos.y, camWidth,32), "Hold Direction and Press Fire to Make a Selection", m_GUISkin.label);
			
			
			
			//display info for the current selection
			var hexCenterPoint:Vector2 = Vector2(camPos.x+camWidth*0.65,camPos.y+camHeight*0.5);
			if(m_CurrSelIndex != -1)
			{	
				var t:Talent = TalentTree.m_Talents[m_Selection[m_CurrSelIndex]] as Talent;
				//GUI.Label(Rect(camPos.x,camPos.y+camHeight*0.25, camWidth,camHeight*0.5), " ", m_GUISkin.label);
				m_Coin.transform.GetChild(0).GetComponent(GUIScript).m_Text = "x"+GetComponent(BeeScript).m_NumUpgradesAvailable;
				m_Coin.transform.GetChild(1).GetComponent(GUIScript).m_Text = "x"+GetComponent(BeeScript).m_NumUpgradesAvailable;
				if(t.m_Cost > GetComponent(BeeScript).m_NumUpgradesAvailable)
				{
					GUI.color *= 0.45;
					GUI.color.a =1;
				}
				GUI.Label(Rect(hexCenterPoint.x-64,hexCenterPoint.y-16, 128,32), t.m_Name, m_GUISkin.GetStyle("MenuHeading"));
				
				GUI.Label(Rect(hexCenterPoint.x-64,hexCenterPoint.y-16+m_GUISkin.GetStyle("MenuHeading").fontSize, 128,32), "COST: "+t.m_Cost.ToString(), m_GUISkin.GetStyle("MenuHeading"));
				GUI.color = Color.white;
				//GUI.Label(Rect(camPos.x,camBottom-30.0, camWidth,30), "", m_GUISkin.label);
				//GUI.Label(Rect(camPos.x+camWidth*0.60+50,camPos.y+camHeight*0.70, 256,32), t.m_Desc, m_GUISkin.GetStyle("MenuText"));
			}
			
			
			for(var i:int = 0; i < m_Selection.length; i++)
			{
				var offset:Vector3 = Quaternion.AngleAxis(-i*60, Vector3.forward) * Vector3.up;
				offset *= m_HexOffset *camScaleY;
				
				var width:float = 190*camScaleY;
				
				if(i == 0)
				{
					if(GetComponent(BeeScript).m_NumUpgradesAvailable <= 0)
						GUI.color.a = 0.5;
					
					m_GUISkin.GetStyle("MenuHeading").alignment = TextAnchor.MiddleLeft;
					GUI.Label(Rect(camPos.x+width*0.5,hexCenterPoint.y-offset.y-width, 128,32), "R1:  Purchase Upgrade", m_GUISkin.GetStyle("MenuHeading"));
					GUI.color = Color.white;
					GUI.Label(Rect(camPos.x+width*0.5,hexCenterPoint.y-offset.y-width + 32, 128,32), "L1:  Exit", m_GUISkin.GetStyle("MenuHeading"));
					m_GUISkin.GetStyle("MenuHeading").alignment = TextAnchor.MiddleCenter;
				}
				
				if(m_CurrSelIndex == i)
				{
					GUI.color = Color.white;
					width  += Mathf.Sin(Time.time*8)*10;
				}
				else
					GUI.color = new Color32(255,246,157,255);
				
				t = TalentTree.m_Talents[m_Selection[i]] as Talent;
				if(t.m_Cost > GetComponent(BeeScript).m_NumUpgradesAvailable)
				{
					GUI.color *= 0.5;
					GUI.color.a =1;
				}
				GUI.DrawTexture(Rect(hexCenterPoint.x+offset.x-width*0.5,hexCenterPoint.y-offset.y-width*0.5, width,width), m_HexBGTexture);
				
				GUI.color = Color.black;
				if(FindIcon(t.m_ImgName) != null)
					GUI.DrawTexture(Rect(hexCenterPoint.x+offset.x-width*0.25,hexCenterPoint.y-offset.y-width*0.25, width*0.5,width*0.5), FindIcon(t.m_ImgName));
				GUI.color = Color.white;
			}
			var beeCtrlScript:BeeControllerScript = GetComponent(BeeControllerScript);
			var count = 0;
			var statsPoint:Vector2 = Vector2(camPos.x+camWidth*0.60,camPos.y+camHeight*0.27);
			var fontSize = m_GUISkin.GetStyle("DescriptionText").fontSize;
			 // for(var s:String in beeCtrlScript.m_Stats.Keys)
			 // {
				// if(s == "Loadout" || s == "Powershot" || s == "Special_Rounds")
					// continue;
					// var label = s.Replace("_", " ");
					// //label.Replace("_", " ");
				 // GUI.Label(Rect(statsPoint.x,statsPoint.y+fontSize*count, 128,30), label, m_GUISkin.GetStyle("DescriptionText"));
				 
				 // //draw empty sqaures for the meter
				 // for(var p:int = 0; p < 5; p++)
				 // {
					// GUI.DrawTexture(Rect(statsPoint.x+(8+p)*fontSize*1.1,statsPoint.y+fontSize*0.25+count*fontSize,fontSize,fontSize*.75), GetComponent(BeeScript).ReloadBarTexture, ScaleMode.StretchToFill, true);
				 // }
				 
				 // //draw the filled in squares for the meter
				 // var val:int = beeCtrlScript.m_Stats[s];
				 // t = TalentTree.m_Talents[m_Selection[m_CurrSelIndex]] as Talent;
				// for(var key:String in t.m_Stats.Keys)
				// {
					// if(key == s)
					// {
						// var updatedVal : int = t.m_Stats[key];
						// val += updatedVal;
						// break;
					// }
					
				// }
				
				 // for(p = 0; p < (val+1); p++)
				 // {
					// GUI.DrawTexture(Rect(statsPoint.x+(8+p)*fontSize*1.1,statsPoint.y+fontSize*0.25+count*fontSize,fontSize,fontSize*.75), GetComponent(BeeScript).ReloadBarTexture, ScaleMode.StretchToFill, true);
					// GUI.DrawTexture(Rect(statsPoint.x+(8+p)*fontSize*1.1,statsPoint.y+fontSize*0.25+count*fontSize,fontSize,fontSize*.75), GetComponent(BeeScript).ReloadBarTexture, ScaleMode.StretchToFill, true);
				 // }
				 // count++;
			 // }
			
			width = 256;
		}
		
		
	}
}