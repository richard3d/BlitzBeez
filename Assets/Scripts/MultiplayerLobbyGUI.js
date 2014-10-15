
#pragma strict
class LevelPrev
{
	var m_Tex : Texture2D = null;
	var m_Name : String = null;
}


var Style : GUIStyle;
var m_GUISkin : GUISkin;
var m_LevelPreviews : LevelPrev[];
private var m_LevelIndex : int = 0;

static var m_HostListTimeout : float = 10;
private var m_HostListWaitTimer : float = 0;
private var m_MenuPos:Vector2;


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
}

function ResetMenu()
{
	m_MenuPos = Vector2(-Screen.width, 256);
}

function Update () {

	if(Input.GetKeyDown(KeyCode.Escape))
	{
		if(Network.isServer)
			gameObject.Destroy(gameObject.Find("GameServer"));
		else
			gameObject.Destroy(gameObject.Find("GameClient"));
		Application.LoadLevel(0);
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
	
	if(gameObject.Find("Background") != null && gameObject.Find("Background").animation != null && !gameObject.Find("Background").animation.isPlaying)
		m_MenuPos.x = Mathf.Lerp(m_MenuPos.x,0,Time.deltaTime*5);
}

function OnGUI()
{	
		if(Network.isServer)
		{
			var width : float = 800;
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
						gameObject.Destroy(gameObject.Find("GameServer"));
						Application.LoadLevel(0);
					}
					if(GUILayout.Button("Start Match", m_GUISkin.button))
					{
						// //Tell the clients which level to load
					   GetComponent(ServerScript).m_ConnectMsgsView.RPC("LoadLevel", RPCMode.Others, "Scene2");
					   GetComponent(ServerScript).LoadLevel("Scene2");
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



