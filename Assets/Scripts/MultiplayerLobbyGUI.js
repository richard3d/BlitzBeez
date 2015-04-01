
#pragma strict
class LevelPrev
{
	var m_Tex : Texture2D = null;
	var m_Name : String = null;
}


var Style : GUIStyle;
var m_GUISkin : GUISkin;
var m_LevelPreviews : LevelPrev[];
var m_MenuSound:AudioClip = null;
private var m_LevelIndex : int = 0;

static var m_HostListTimeout : float = 10;
private var m_HostListWaitTimer : float = 0;
private var m_MenuPos:Vector2;

public var m_BeeTexture:RenderTexture;
public var m_ColorStripTexture:Texture2D = null;
public var m_WhitePix:Texture2D = null;

public var m_StartMatch:boolean = false;
public var m_ReturnToMain:boolean = false;
public var m_LocalPlayerScreen:boolean = true;

var pLastInput:float[] = new float[4];
var pColorIndices:int[] = new int[4];
public var m_IsAnimating:boolean = false;


function GetHosts()
{
	//MasterServer.ipAddress = "127.0.0.1";
	MasterServer.RequestHostList("BeeHappy");
	m_HostListWaitTimer = m_HostListTimeout;
}

function Awake()
{
	m_MenuPos = Vector2(-Screen.width, Screen.height*0.25);
}

function Start () {

	if(!Network.isServer)
	{
		GetHosts();		
	}
	for(var i:int = 0; i < 4; i++)
	{
		pColorIndices[i] = 7;
	}
	
	
}

function ResetMenu(left:boolean)
{
	if(left)
		m_MenuPos = Vector2(-Screen.width, Screen.height*0.25);
	else
		m_MenuPos = Vector2(Screen.width, Screen.height*0.25);
}

function MenuEnter(fwrd:boolean)
{
	while(m_IsAnimating)
		yield WaitForSeconds(0.0166);
		
		
	m_IsAnimating = true;
	ResetMenu(fwrd);
	m_LocalPlayerScreen = !m_LocalPlayerScreen;
	
	while(m_MenuPos.x != 0)
	{
		m_MenuPos.x = Mathf.Lerp(m_MenuPos.x,0,0.0166*20);
		if(Mathf.Abs(m_MenuPos.x) < 1)
			break;
		yield WaitForSeconds(0.0166);
	}
	m_IsAnimating = false;
}

function MenuExit(fwrd:boolean)
{
	while(m_IsAnimating)
		yield WaitForSeconds(0.0166);
	m_IsAnimating = true;
	var vel:float = Screen.width*0.5;
	var accel :float = Screen.width*40;
	if(fwrd)
	{
		
		while(Mathf.Abs(m_MenuPos.x) <  Screen.width)
		{
			vel += accel * 0.0166;
			m_MenuPos.x += vel*0.0166;//Mathf.Lerp(m_MenuPos.x,Screen.width,0.0166*20);
			yield WaitForSeconds(0.0166);
		}
	}
	else
	{
		while(m_MenuPos.x > -Screen.width)
		{
			vel += accel * 0.0166;
			m_MenuPos.x -= vel*0.0166;
			yield WaitForSeconds(0.0166);
		}
	}
	m_IsAnimating = false;
}

function CameraOutro()
{
	while(m_IsAnimating)
		yield WaitForSeconds(0.0166);
	m_IsAnimating = true;
	gameObject.Find("Title").animation.Stop();
	gameObject.Find("Title").animation["TitleMapMenu"].time = gameObject.Find("Title").animation["TitleMapMenu"].length;
	gameObject.Find("Title").animation["TitleMapMenu"].speed = -1;
	gameObject.Find("Title").animation.Play();
	Camera.main.animation.Play("CameraMapMenuReturn");
	yield WaitForSeconds(Camera.main.animation["CameraMapMenuReturn"].length);
	m_IsAnimating = false;
	if(Network.isServer)
		gameObject.Destroy(gameObject.Find("GameServer"));
	else
		gameObject.Destroy(gameObject.Find("GameClient"));
	
	Application.LoadLevel(0);
}

function CameraStart()
{
	while(m_IsAnimating)
		yield WaitForSeconds(0.0166);
	m_IsAnimating = true;
	gameObject.Find("Title").animation.Stop();
	gameObject.Find("Title").animation["TitleMapMenu"].time = gameObject.Find("Title").animation["TitleMapMenu"].length;
	gameObject.Find("Title").animation["TitleMapMenu"].speed = -1;
	gameObject.Find("Title").animation.Play();
	Camera.main.animation.Play("CameraMapMenuExit");
	
	yield WaitForSeconds(Camera.main.animation["CameraMapMenuExit"].length);
	m_IsAnimating = false;
	StartMatch();
}

function Update () {

	gameObject.Find("BeeCamera").camera.targetTexture = m_BeeTexture;
	
	
	for(var i:int = 0; i < 4; i++)
	{
		if(Input.GetButtonDown("Joy"+i+" Start"))
		{
			if(Network.isServer)
			{
				var plr : NetworkPlayer;
				GetComponent(ServerScript).OnLocalPlayerConnected(plr, i);
			
				
				if(!GameObject.Find("Bee"+(i+1)).renderer.enabled)
				{
					GameObject.Find("Bee"+(i+1)).animation.enabled = true;
					GameObject.Find("Bee"+(i+1)).renderer.enabled = true;
				
					var go:GameObject = GameObject.Instantiate(Resources.Load("GameObjects/ScreenFlash"), Vector3(0.5, 0.5, 0), Quaternion.identity);
					go.animation.Stop("FlashIntro");
					go.animation["FlashIntro"].time = 2.35;
					go.animation.Play("FlashIntro");
				}
			}
		}
		
		var bee:GameObject = GameObject.Find("Bee"+(i+1));
		bee.transform.eulerAngles.y += Time.deltaTime * 360*Input.GetAxis("Joy"+i+" Look Left/Right");
		
		var currInput:float = Input.GetAxis("Joy"+i+" Strafe Left/Right");
		if(currInput != 0 && pLastInput[i] == 0)
		{
			if(currInput > 0)
			{
				pColorIndices[i] += 14;
			}
			else
			{
				pColorIndices[i] -= 14;
			}
			bee.renderer.material.color = m_ColorStripTexture.GetPixel(pColorIndices[i],10);	
			if(Network.isServer)
			{
				for(var k:int =0 ; k < 4; k++)
				{
					if(GetComponent(ServerScript).GetClient(k) != null)
					{
						if(GetComponent(ServerScript).GetClient(k).m_JoyNum == i)
							GetComponent(ServerScript).GetClient(k).m_Color = bee.renderer.material.color;
					}
				}
			}
		
		}
		pLastInput[i] = currInput;
	}
	
	if(Input.GetButtonDown("Joy0 OK") && !m_IsAnimating)
	{
		if(m_LocalPlayerScreen)
		{
			AudioSource.PlayClipAtPoint(m_MenuSound, Camera.main.transform.position);
			go= GameObject.Instantiate(Resources.Load("GameObjects/ScreenFlash"), Vector3(0.5, 0.5, 0), Quaternion.identity);
			go.animation.Stop("FlashIntro");
			go.animation["FlashIntro"].time = 2.35;
			go.animation.Play("FlashIntro");
			MenuExit(true);
			MenuEnter(true);
			if(Network.isServer)
			{
				MasterServer.RegisterHost("BeeHappy", SystemInfo.deviceName, "Bzzz death to all!");
			}
			
		}
		else
		{
			AudioSource.PlayClipAtPoint(m_MenuSound, Camera.main.transform.position);
			go= GameObject.Instantiate(Resources.Load("GameObjects/ScreenFlash"), Vector3(0.5, 0.5, 0), Quaternion.identity);
			go.animation.Stop("FlashIntro");
			go.animation["FlashIntro"].time = 2.35;
			go.animation.Play("FlashIntro");
			MenuExit(true);
			CameraStart();
			
		}		
	}
	
	if(Input.GetButtonDown("Joy0 Cancel"))
	{
		if(m_LocalPlayerScreen)
		{
			MenuExit(false);
			CameraOutro();
		}
		else
		{
			
			MenuExit(false);
			MenuEnter(false);
			
		}
	}
	

	if(!Network.isServer)
	{
		if(gameObject.Find("Title") != null)
			gameObject.Find("Title").active = false;
	}
	else
	{
		networkView.RPC("SetLevelPreviewIndex", RPCMode.Others,m_LevelIndex);
	}
}

function OnLevelWasLoaded(i:int)
{
	if(i == 4)
	{
		m_IsAnimating = true;
		yield WaitForSeconds(0.75);
		m_IsAnimating = false;
		MenuEnter(true);
	}
}



function WaitForExitAnimation()
{

	
}

function StartMatch()
{
	m_StartMatch = false;
	if(Network.isServer)
	{
		GetComponent(ServerScript).m_ConnectMsgsView.RPC("LoadLevel", RPCMode.Others, "Scene2");
		GetComponent(ServerScript).LoadLevel("Scene2");
	}
	
}

function OnGUI()
{	
	if(m_LocalPlayerScreen)
	{
		var width : float = 800;
		
		GUILayout.BeginArea (Rect(m_MenuPos.x, m_MenuPos.y, Screen.width,Screen.height*0.5), m_GUISkin.GetStyle("Background"));		
		GUILayout.BeginHorizontal();
			for(var p:int = 0; p < 4; p++)
			{
				if(!GameObject.Find("Bee"+(p+1)).renderer.enabled )
					GUI.color.a = 0.5;
				GUILayout.Label("P "+(p+1), m_GUISkin.GetStyle("Heading"));
				GUI.color.a = 1;
				//GUI.color = Color.white;
			
			}
		GUILayout.EndHorizontal();
		
		
		GUILayout.BeginHorizontal();
		for(p = 0; p < 4; p++)
		{
			if(GetComponent(ServerScript).GetClient(p) != null)
			{
				GameObject.Find("Bee"+(p+1)).renderer.material.color = GetComponent(ServerScript).GetClient(p).m_Color;
				//GUI.color.a = 0.25;
				//GUI.DrawTexture(Rect(p*Screen.width*0.25, 34 ,Screen.width*0.25, Screen.height*0.5),m_WhitePix);
				//GUI.color = Color.white;
				GameObject.Find("Bee"+(p+1)).animation.enabled = true;
				GameObject.Find("Bee"+(p+1)).renderer.enabled = true;
				GUI.DrawTexture(Rect(0, 0 ,Screen.width, Screen.height),m_BeeTexture);
				GUI.Label(Rect(p*Screen.width*0.25, Screen.height*0.5 - 32,Screen.width*0.25, 32),"<- Select Color ->",m_GUISkin.label);
				
				
			}
			else
			{
				//GUILayout.Label("[ Press Start to Join ]", m_GUISkin.label, GUILayout.ExpandHeight(true), GUILayout.MinWidth(Screen.width*0.25 -  m_GUISkin.label.margin.right*2));
				GUI.Label(Rect(p*Screen.width*0.25 + m_GUISkin.label.margin.right, 0 ,Screen.width*0.25 - m_GUISkin.label.margin.right*2, Screen.height*0.5), "[ Press Start to Join ]", m_GUISkin.label);
			}
			
		}
		GUILayout.EndHorizontal();
		GUILayout.EndArea();
		
		
		
		return;
	}

	if(Network.isServer)
	{
		
		//var width : float = 800;
		GUILayout.BeginArea (Rect(m_MenuPos.x, m_MenuPos.y, 512,Screen.height*0.5), m_GUISkin.customStyles[0]);
			
			GUILayout.BeginHorizontal();
				
				if(GUILayout.Button("<", m_GUISkin.button))
				{
					m_LevelIndex--;
					if(m_LevelIndex < 0)
						m_LevelIndex = m_LevelPreviews.length - 1;
				}
				
				GUILayout.Label(m_LevelPreviews[m_LevelIndex].m_Name, m_GUISkin.label);
				
				if(GUILayout.Button(">", m_GUISkin.button))
				{
					m_LevelIndex++;
					if(m_LevelIndex >= m_LevelPreviews.length )
						m_LevelIndex = 0;
				}
			GUILayout.EndHorizontal();
			
			
			GUILayout.Label( m_LevelPreviews[m_LevelIndex].m_Tex,  m_GUISkin.label, GUILayout.MaxHeight(64));
			
			GUILayout.BeginHorizontal();
				
				if(GUILayout.Button("Return to Main Menu", m_GUISkin.button))
				{
					//m_ReturnToMain = true;
					// AudioSource.PlayClipAtPoint(m_MenuSound, Camera.main.transform.position);
					// gameObject.Destroy(gameObject.Find("GameServer"));
					// Application.LoadLevel(0);
				}
				if(GUILayout.Button("Start Match", m_GUISkin.button))
				{
					// //Tell the clients which level to load

					//m_StartMatch = true;
					//AudioSource.PlayClipAtPoint(m_MenuSound, Camera.main.transform.position);
					//StartMatch();
					//AudioSource.PlayClipAtPoint(m_MenuSound, Camera.main.transform.position);
				 //  GetComponent(ServerScript).m_ConnectMsgsView.RPC("LoadLevel", RPCMode.Others, "Scene2");
				  // GetComponent(ServerScript).LoadLevel("Scene2");
				}
			GUILayout.EndHorizontal();
		GUILayout.EndArea();
		
		GUILayout.BeginArea (Rect(m_MenuPos.x+512, m_MenuPos.y, Screen.width - 512,Screen.height*0.5), m_GUISkin.customStyles[0]);
		var comp : ServerScript = GetComponent(ServerScript) as ServerScript;
		if(comp.GetNumClients() == 0)
		{
			GUILayout.Label("Waiting for other players to join...");
		}
		else
		{
			for(var i : int = 0; i < comp.GetNumClients(); i++)
			{
				GUILayout.Label(comp.GetClient(i).m_Name, m_GUISkin.label);		
			}
			if(comp.GetNumClients() == 1)
			{
				GUILayout.Label("Waiting for other players to join...", m_GUISkin.label);	
			}
		}
		GUILayout.EndArea();
	}
	else
	{
		width = 800;
		GUILayout.BeginArea (Rect(m_MenuPos.x, m_MenuPos.y, Screen.width,Screen.height*0.5), m_GUISkin.customStyles[0]);
		
		
		
		var cliScript:ClientScript = gameObject.Find("GameClient").GetComponent(ClientScript);
		if(cliScript.GetNumClients() > 0)
		{
			GUILayout.BeginArea (Rect(0, 0, 512,Screen.height*0.5), m_GUISkin.customStyles[0]);
				GUILayout.Label(m_LevelPreviews[m_LevelIndex].m_Name, m_GUISkin.label);
				GUILayout.Label( m_LevelPreviews[m_LevelIndex].m_Tex,  m_GUISkin.label,GUILayout.MaxHeight(64));
				if(GUILayout.Button("Return to Main Menu", m_GUISkin.button))
				{
					gameObject.Destroy(gameObject.Find("GameClient"));
					Application.LoadLevel(0);
				}
			GUILayout.EndArea();
			GUILayout.BeginArea (Rect(m_MenuPos.x+512, 0, Screen.width - 512,Screen.height*0.5), m_GUISkin.customStyles[0]);
			GUILayout.Label("Waiting for Match to Start..." , m_GUISkin.label);
			for(i= 0; i < cliScript.GetNumClients(); i++)
			{
				GUILayout.Label(cliScript.GetClient(i).m_Name, m_GUISkin.label);		
			}
			GUILayout.EndArea();
		}
		else
		{
			var data : HostData[] = MasterServer.PollHostList();	
			if(GUILayout.Button("Refresh ServerList", m_GUISkin.button))
			{
				GetHosts();
			}
			
			if(data.length == 0)
			{
				m_HostListWaitTimer -= Time.deltaTime;
				if(m_HostListWaitTimer > 0)
					GUILayout.Label("Searching for games...");
				else
					GUILayout.Label("0 games found...");
			}
			
			// Go through all the hosts in the host list
			for (var element in data)
			{
				//GUILayout.BeginHorizontal();	
				var name = element.gameName + " " + element.connectedPlayers + " / " + element.playerLimit;
				//GUILayout.Label(name, m_GUISkin.label);	
				//GUILayout.Space(5);
				var hostInfo : String;
				hostInfo = "[";
				for (var host in element.ip)
					hostInfo = hostInfo + host + ":" + element.port + " ";
				hostInfo = hostInfo + "]";
				//GUILayout.Label(hostInfo, m_GUISkin.label);	
				//GUILayout.Space(5);
				//GUILayout.Label(element.comment, m_GUISkin.label);
				//GUILayout.Space(5);
				//GUILayout.FlexibleSpace();
				if (GUILayout.Button(name+" "+hostInfo+" "+element.comment, m_GUISkin.button))
				{
					// Connect to HostData struct, internally the correct method is used (GUID when using NAT).
					Network.Connect(element);
					//this.enabled = false;			
				
				}
				//GUILayout.EndHorizontal();	
			}
			
			GUILayout.FlexibleSpace();
			GUILayout.BeginHorizontal();
		//	GUILayout.FlexibleSpace();		
			if(GUILayout.Button("Return to Main Menu", m_GUISkin.button))
			{	
				gameObject.Destroy(gameObject.Find("GameClient"));
				Application.LoadLevel(0);
			}
			GUILayout.EndHorizontal();
		}
	
		GUILayout.EndArea();
	}
}

@RPC function SetLevelPreviewIndex(index:int)
{
	m_LevelIndex = index;
}

function OnFailedToConnect(error: NetworkConnectionError) {
    Debug.Log("Could not connect to server: "+ error);
}

function OnConnectedToServer() {
	//Network.isMessageQueueRunning = false;
	//Application.LoadLevel("Scene2");
    Debug.Log("Connected to server");
    // Send local player name to server ...
}



