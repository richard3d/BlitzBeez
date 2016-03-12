#pragma strict

var Style : GUIStyle;
var ServerInstance : GameObject;
var ClientInstance : GameObject;
var m_Skin:GUISkin = null;
var m_ColorPicker:Texture2D = null;
var m_TitleIntroSound:AudioClip = null;
var m_MenuSelectSound:AudioClip = null;
var m_MenuSound:AudioClip = null;

var m_TutorialTextures:Texture2D[] = null;
private var m_CurrTutorialIndex:int = 0;
private var m_ShowOptions:boolean = false;
private var m_ShowMainMenu:boolean = false;
public var m_MenuPos :Vector2;

public var m_Sel:int = 0;
public var m_NumSel:int = 4;
public var m_PrevInput:float = 0;
public var m_CurrInput:float = 0;

function Start () {
	GameObject.Find("MainBee").GetComponent.<Renderer>().material.color = PlayerProfile.m_PlayerColor;
	m_MenuPos.y = Screen.height*0.25;
	GameObject.Find("BeeParticles").GetComponent.<Renderer>().enabled = false;
	//m_Skin.GetStyle("MainButton").fixedWidth = 6.166 * m_Skin.GetStyle("MainButton").fontSize;
}

function OnEnable(){

}

function Show()
{
	m_ShowMainMenu = true;
	AudioSource.PlayClipAtPoint(m_TitleIntroSound, Camera.main.transform.position);
	GameObject.Find("BeeParticles").GetComponent.<Renderer>().enabled = true;
}

function Update () {

	if(m_ShowMainMenu)
	{
		if(Mathf.Abs(transform.position.x) > 0.25)
		{
			transform.position.x += (0-transform.position.x)*Time.deltaTime*8;
		}
		else
		{
			transform.position.x = Random.Range(-0.2, 0.2);
			transform.position.y = Random.Range(-0.2, 0.2);
		}
	}
	else
	{
		transform.position.x += (123-transform.position.x)*Time.deltaTime*8;
	}
	
	var currInput:float = Input.GetAxis("Joy0 Move Forward/Back")+Input.GetAxis("Joy0 Strafe Left/Right")+Input.GetAxis("Joy0 Dpad Up/Down"); 
	if(m_ShowOptions)
	{
		if(Input.GetAxis("Joy0 Cancel"))
		{
			HideOptions();
		}
		
		if(Input.GetAxis("Joy0 Strafe Left/Right") > 0 && m_PrevInput == 0)
		{
			if(m_CurrTutorialIndex < m_TutorialTextures.length-1)
			{
				m_CurrTutorialIndex++;
			}
		}
		if(Input.GetAxis("Joy0 Strafe Left/Right") < 0 && m_PrevInput == 0)
		{
			if(m_CurrTutorialIndex > 0)
			{
				m_CurrTutorialIndex--;	
			}			
		}
	}
	else
	{
		if((Input.GetAxis("Joy0 Move Forward/Back") < 0 || Input.GetAxis("Joy0 Dpad Up/Down") < 0) && m_PrevInput == 0)
		{
			if(m_Sel < m_NumSel-1)
			{
				var gos:GameObject[] = GameObject.FindGameObjectsWithTag("Flowers");
				var flw:int = Random.Range(0,gos.length-1);
				//GameObject.Find("WorkerBee").transform.parent = gos[flw].transform;
				AudioSource.PlayClipAtPoint(m_MenuSelectSound, Camera.main.transform.position);
				m_Sel++;
			}
		}
		if((Input.GetAxis("Joy0 Move Forward/Back") > 0 || Input.GetAxis("Joy0 Dpad Up/Down") > 0) && m_PrevInput == 0)
		{
			if(m_Sel > 0)
			{
				gos= GameObject.FindGameObjectsWithTag("Flowers");
				flw = Random.Range(0,gos.length-1);
				//GameObject.Find("WorkerBee").transform.parent = gos[flw].transform;
				AudioSource.PlayClipAtPoint(m_MenuSelectSound, Camera.main.transform.position);
				m_Sel--;	
			}			
		}
	}
	m_PrevInput = currInput;
}


function ShowTutorial()
{

	m_ShowMainMenu = false;
	m_CurrTutorialIndex = 0;
	Camera.main.GetComponent(TiltShift).enabled = true;
	GetComponent(TutorialGUI).enabled = true;
}

function HideTutorial()
{
	m_ShowMainMenu = true;
	Camera.main.GetComponent(TiltShift).enabled = false;
	GetComponent(TutorialGUI).enabled = false;
	//GetComponent(TutorialGUI).MenuExit(false);
}

function ShowOptions()
{
	m_ShowOptions = true;
	m_ShowMainMenu = false;
	Camera.main.GetComponent(TiltShift).enabled = true;
	GetComponent.<Animation>()["MenuSlideRight"].time = 0;
	GetComponent.<Animation>()["MenuSlideRight"].speed = 1;
	GetComponent.<Animation>().Play("MenuSlideRight");
}

function HideOptions()
{
	m_ShowMainMenu = true;
	Camera.main.GetComponent(TiltShift).enabled = false;
	GetComponent.<Animation>()["MenuSlideRight"].time = GetComponent.<Animation>()["MenuSlideRight"].length;
	GetComponent.<Animation>()["MenuSlideRight"].speed = -1;
	GetComponent.<Animation>().Play("MenuSlideRight");
}

function OnGUI()
{
	if(m_Sel == 0)
	{
		GUI.FocusControl("Create");
	}
	else if(m_Sel == 1)
	{
		GUI.FocusControl("How To Play");
	}
	else if(m_Sel == 2)
	{
		GUI.FocusControl("Exit");
	}
	
	// if(m_Sel == 0)
	// {
		// GUI.FocusControl("Create");
	// }
	// else if(m_Sel == 1)
	// {
		// GUI.FocusControl("Join");
	// }
	// else if(m_Sel == 2)
	// {
		// GUI.FocusControl("How To Play");
	// }
	// else if(m_Sel == 3)
	// {
		// GUI.FocusControl("Exit");
	// }
	
	var width : float = m_Skin.GetStyle("MainButton").fixedWidth;
	if(m_ShowMainMenu)
	{
		GUI.BeginGroup(Rect(Screen.width * 0.5-128, Screen.height * 0.75, width,500));
		var defaultFont = m_Skin.GetStyle("MainButton").fontSize;
		var fontSize:float = defaultFont;
		var selectedFontSize = (Mathf.Sin(Time.time*10))*4+32;
	
		GUI.SetNextControlName("Create");
		fontSize = GUI.GetNameOfFocusedControl() == "Create" ? selectedFontSize:defaultFont;
		m_Skin.GetStyle("MainButton").fontSize = fontSize;

		if (GUI.Button(Rect(0,0,256,defaultFont),"Start Game", m_Skin.GetStyle("MainButton")) || (Input.GetAxis("Joy0 OK") && GUI.GetNameOfFocusedControl() == "Create")) 
		{
			if(GameObject.Find("Title").GetComponent.<Animation>().isPlaying == false)
			{
				GameObject.Find("Flash").GetComponent.<Animation>().Stop("FlashIntro");
				GameObject.Find("Flash").GetComponent.<Animation>()["FlashIntro"].time = 2.35;
				GameObject.Find("Flash").GetComponent.<Animation>().Play("FlashIntro");
				
				AudioSource.PlayClipAtPoint(m_MenuSound, Camera.main.transform.position);
				GetComponent(Animation).Play("CameraIntro");
				GameObject.Find("MainBee").GetComponent(MainMenuBeeScript).m_Timer = 999;
				GameObject.Find("MainBee").GetComponent(MainMenuBeeScript).m_WorldPos = Vector3(0,20,0);
				GameObject.Find("Title").GetComponent.<Animation>().Stop();
				GameObject.Find("Title").GetComponent(GUITexture).enabled = false;
				Camera.main.GetComponent(MotionBlur).enabled = true;
				this.enabled = false;
			}
			
		}
		
		m_Skin.GetStyle("MainButton").fontSize = defaultFont;
		
		GUI.SetNextControlName("Join");
		fontSize = GUI.GetNameOfFocusedControl() == "Join" ? selectedFontSize:defaultFont;
		m_Skin.GetStyle("MainButton").fontSize = fontSize;

		// if(GUI.Button(Rect(0,defaultFont,256,defaultFont),"Join Game", m_Skin.GetStyle("MainButton")) || (Input.GetAxis("Joy0 OK") && GUI.GetNameOfFocusedControl() == "Join"))
		// {
			// AudioSource.PlayClipAtPoint(m_MenuSound, Camera.main.transform.position);
			// GetComponent(Animation).Play("CameraClientIntro");
			// GameObject.Find("MainBee").GetComponent(MainMenuBeeScript).m_Timer = 999;
			// GameObject.Find("MainBee").GetComponent(MainMenuBeeScript).m_WorldPos = Vector3(0,20,0);
			// GameObject.Find("Title").animation.Stop();
			// GameObject.Find("Title").GetComponent(GUITexture).enabled = false;
			// Camera.main.GetComponent(MotionBlur).enabled = true;
			// this.enabled = false;
			
		// }
		m_Skin.GetStyle("MainButton").fontSize = defaultFont;
		
		GUI.SetNextControlName("How To Play");
		fontSize = GUI.GetNameOfFocusedControl() == "How To Play" ? selectedFontSize:defaultFont;
		m_Skin.GetStyle("MainButton").fontSize = fontSize;
		if(GUI.Button(Rect(0,defaultFont*1,256,defaultFont),"How To Play", m_Skin.GetStyle("MainButton")) || (Input.GetAxis("Joy0 OK") && GUI.GetNameOfFocusedControl() == "How To Play"))
		{
			AudioSource.PlayClipAtPoint(m_MenuSound, Camera.main.transform.position);
			ShowTutorial();
			//ShowOptions();
		}
		m_Skin.GetStyle("MainButton").fontSize = defaultFont;
		
		GUI.SetNextControlName("Exit");
		fontSize = GUI.GetNameOfFocusedControl() == "Exit" ? selectedFontSize:defaultFont;
		m_Skin.GetStyle("MainButton").fontSize = fontSize;
		if(GUI.Button(Rect(0,defaultFont*2,256,defaultFont),"Exit Game", m_Skin.GetStyle("MainButton")) || (Input.GetAxis("Joy0 OK") && GUI.GetNameOfFocusedControl() == "Exit"))
		{
			AudioSource.PlayClipAtPoint(m_MenuSound, Camera.main.transform.position);
			Application.Quit();
		}
		m_Skin.GetStyle("MainButton").fontSize = defaultFont;
		GUI.EndGroup();
	}
	
	if(m_ShowOptions)
	{
		var pos : Vector2 = m_MenuPos;
		GUILayout.BeginArea (Rect(pos.x, pos.y, Screen.width,Screen.height*0.5), m_Skin.customStyles[0]);
			GUILayout.BeginHorizontal();
		
			GUILayout.Box(m_TutorialTextures[m_CurrTutorialIndex]);
			
			GUILayout.EndHorizontal();
		GUILayout.EndArea();
	}
}

function OnMasterServerEvent(msEvent: MasterServerEvent) {
    
}

function StartServer()
{
	Camera.main.GetComponent(MotionBlur).enabled = false;
		GameObject.Find("Swarm").active = false;
		var server : GameObject = gameObject.Instantiate(ServerInstance);
		server.name = "GameServer";	
		Application.LoadLevel("MapSelectMenu");
}

function StartClient()
{
		Camera.main.GetComponent(MotionBlur).enabled = false;
		GameObject.Find("Swarm").active = false;
		var server : GameObject = gameObject.Instantiate(ClientInstance);
		server.name = "GameClient";	
		Application.LoadLevel("MapSelectMenu");
}