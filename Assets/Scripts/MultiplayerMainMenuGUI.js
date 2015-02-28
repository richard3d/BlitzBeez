#pragma strict

var Style : GUIStyle;
var ServerInstance : GameObject;
var ClientInstance : GameObject;
var m_Skin:GUISkin = null;
var m_ColorPicker:Texture2D = null;
var m_MenuSound:AudioClip = null;
private var m_ShowOptions:boolean = false;
private var m_ShowMainMenu:boolean = true;
public var m_MenuPos :Vector2;
function Start () {
GameObject.Find("MainBee").renderer.material.color = PlayerProfile.m_PlayerColor;
m_MenuPos.y = Screen.height*0.25;
GameObject.Find("BeeParticles").renderer.enabled = false;
}

function OnEnable(){
GameObject.Find("BeeParticles").renderer.enabled = true;
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
}

function ShowOptions()
{
	m_ShowOptions = true;
	m_ShowMainMenu = false;
	Camera.main.GetComponent(TiltShift).enabled = true;
	animation["MenuSlideRight"].time = 0;
	animation["MenuSlideRight"].speed = 1;
	animation.Play("MenuSlideRight");
}

function HideOptions()
{
	m_ShowMainMenu = true;
	Camera.main.GetComponent(TiltShift).enabled = false;
	animation["MenuSlideRight"].time = animation["MenuSlideRight"].length;
	animation["MenuSlideRight"].speed = -1;
	animation.Play("MenuSlideRight");
}

function OnGUI()
{

	var width : float = 100;
	if(m_ShowMainMenu)
	{
		GUILayout.BeginArea (Rect(Screen.width*0.5 - width, Screen.height * 0.65, width*2,500));
	
		if (GUILayout.Button ("Create Game", Style)) 
		{
		
			GameObject.Find("Flash").animation.Stop("FlashIntro");
			GameObject.Find("Flash").animation["FlashIntro"].time = 2.35;
			GameObject.Find("Flash").animation.Play("FlashIntro");
			
			AudioSource.PlayClipAtPoint(m_MenuSound, Camera.main.transform.position);
			GetComponent(Animation).Play("CameraIntro");
			GameObject.Find("MainBee").GetComponent(MainMenuBeeScript).m_Timer = 999;
			GameObject.Find("MainBee").GetComponent(MainMenuBeeScript).m_WorldPos = Vector3(0,20,0);
			GameObject.Find("Title").active = false;
			Camera.main.GetComponent(MotionBlur).enabled = true;
			this.enabled = false;
			
		}
		if(GUILayout.Button ("Join Game", Style))
		{
			AudioSource.PlayClipAtPoint(m_MenuSound, Camera.main.transform.position);
			GetComponent(Animation).Play("CameraClientIntro");
			GameObject.Find("MainBee").GetComponent(MainMenuBeeScript).m_Timer = 999;
			GameObject.Find("MainBee").GetComponent(MainMenuBeeScript).m_WorldPos = Vector3(0,20,0);
			GameObject.Find("Title").active = false;
			Camera.main.GetComponent(MotionBlur).enabled = true;
			this.enabled = false;
			
		}
		if(GUILayout.Button ("Options", Style))
		{
			AudioSource.PlayClipAtPoint(m_MenuSound, Camera.main.transform.position);
			ShowOptions();
		}
		if(GUILayout.Button ("Exit Game", Style))
		{
			AudioSource.PlayClipAtPoint(m_MenuSound, Camera.main.transform.position);
			Application.Quit();
		}
		GUILayout.EndArea();
	}
	if(m_ShowOptions)
	{
		var pos : Vector2 = m_MenuPos;
		GUILayout.BeginArea (Rect(pos.x, pos.y, Screen.width,Screen.height*0.50), m_Skin.customStyles[0]);
			GUILayout.BeginArea (Rect(Screen.width*0.5-256, 0, 512,Screen.height*0.50), m_Skin.customStyles[0]);
			GUILayout.BeginHorizontal();
				GUILayout.Label("Bee Tag",m_Skin.label, GUILayout.Width(256));
				PlayerProfile.m_PlayerTag =	GUILayout.TextField(PlayerProfile.m_PlayerTag,m_Skin.textField,GUILayout.Width(245));
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
				
				var ops:GUILayoutOption[]= [GUILayout.Width(256),GUILayout.Height(128)];
				GUILayout.Label("Bee Color",m_Skin.label,ops);
				
				var oldColor = GUI.color;
				GUI.color  = PlayerProfile.m_PlayerColor;
				GUILayout.Label("RGB",m_Skin.label);
				GUI.color = oldColor;
				if (GUILayout.RepeatButton (m_ColorPicker,[GUILayout.Width(128), GUILayout.Height(128)])) 
				{
					var pickpos = Event.current.mousePosition;
					
					if(Event.current.type != EventType.Used)
					{
						var rect:Rect = GUILayoutUtility.GetLastRect();
						Debug.Log(Event.current.type);
						PlayerProfile.m_PlayerColor = m_ColorPicker.GetPixel(pickpos.x-rect.x,128-(pickpos.y-rect.y));
						GameObject.Find("MainBee").renderer.material.color = PlayerProfile.m_PlayerColor;
						GameObject.Find("Swarm").renderer.material.color = PlayerProfile.m_PlayerColor;
					}
				}
				
				
			GUILayout.EndHorizontal();	
			
			GUILayout.BeginHorizontal();
				GUILayout.Label("Bee Swag",m_Skin.label,[GUILayout.Width(256),GUILayout.ExpandHeight(true)]);
				GUILayout.Label("COMING SOON!",m_Skin.label,[GUILayout.Width(256),GUILayout.ExpandHeight(true)]);
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
				GUILayout.Label("Master Server IP",m_Skin.label, GUILayout.Width(256));
				MasterServer.ipAddress  =	GUILayout.TextField(MasterServer.ipAddress,m_Skin.textField,GUILayout.Width(245));
			GUILayout.EndHorizontal();
			//GUILayout.BeginHorizontal();
			//	GUILayout.FlexibleSpace();
				if(GUILayout.Button("Return to Main Menu", m_Skin.button))
				{
					HideOptions();
				}
			//GUILayout.EndHorizontal();
			GUILayout.EndArea();
		
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