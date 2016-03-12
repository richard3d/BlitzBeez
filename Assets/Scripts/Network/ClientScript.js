#pragma strict

import ClientNetworkInfo;

private var m_ClientCount : int = 0;
private var m_Clients : ClientNetworkInfo[];
private var m_LevelPrefix:int = 0;
var m_ClientID : int = -1;

var m_ConnectMsgsView : NetworkView;
var m_SyncMsgsView : NetworkView;
var m_GameplayMsgsView : NetworkView;



function Awake()
{
	//network group 0 will be reserved for actual gameplay objects (not used by this gameobject)
	//network group 1 is used solely for connect/disconnect info between client and server
	m_ConnectMsgsView = GetComponents(NetworkView)[0] as NetworkView;
	m_ConnectMsgsView.group = 1;
	//network group 2 is used for gamestate/sync information between client and server, this includes object instantiation
	m_SyncMsgsView = GetComponents(NetworkView)[1] as NetworkView;
	m_SyncMsgsView.group = 2;
	//network group 0 is used for gameplay information between client and server, this includes object instantiation
	m_GameplayMsgsView = GetComponents(NetworkView)[2] as NetworkView;
	m_GameplayMsgsView.group = 0;
	
	DontDestroyOnLoad(gameObject);
	//Network.isMessageQueueRunning = false;
}

function Start () {


}

function OnGUI()
{
	var mgr : GameStateManager = GetComponent(GameStateManager);
	if(mgr.m_CurrState == GameStateManager.MATCH_STARTING)
	{
		//if(GetNumClients() > 1)
		var skin :GUISkin = GetComponent(MultiplayerLobbyGUI).m_GUISkin;
		GUILayout.BeginArea(Rect(0,Screen.height*0.25, Screen.width,Screen.height*0.5), skin.customStyles[0]);
		GUILayout.Label("Match starting in "+(mgr.m_MatchTick)+"...", skin.label);
		GUILayout.EndArea();
	}
	else
	if(mgr.m_CurrState == GameStateManager.MATCH_OVER)
	{
		skin = GetComponent(MultiplayerLobbyGUI).m_GUISkin;
		GUILayout.BeginArea(Rect(0,Screen.height*0.25, Screen.width,Screen.height*0.5), skin.customStyles[0]);
		//GUILayout.Label("All Hail "+m_Clients[GameStateManager.m_WinningPlayer].m_Name+".\n The new QUEEN (OR KING) BEE!", skin.label);
		GUILayout.EndArea();
	}
}

function OnStateChange(state:int)
{
	var mgr : GameStateManager = GetComponent(GameStateManager);
	if(mgr.m_CurrState == GameStateManager.MATCH_STARTING)
	{
		GetComponent(MultiplayerLobbyGUI).enabled = false;
	}
	if(mgr.m_CurrState == GameStateManager.MATCH_PLAYING)
	{
		for(var i = 0; i < GetNumClients(); i++)
		{
			//make sure the client doesnt already own a gameobject and make sure the level is loaded for them first too
			if(m_Clients[i].m_GameObject != null && m_Clients[i].m_LevelLoaded)
			{			
				m_Clients[i].m_GameObject.GetComponent(BeeControllerScript).m_ControlEnabled = true;
			}
		}
	}
	else
	if(mgr.m_CurrState == GameStateManager.MATCH_OVER)
	{
		Cursor.visible = true;
		if(GetGameObject() != null)
			GetGameObject().GetComponent(NetworkInputScript).enabled = false;
	}
	else if(mgr.m_CurrState == GameStateManager.MATCH_LOBBY)
	{
		Debug.Log("Returned to Lobby");
		ReturnToLobby();
		Destroy(m_Clients[m_ClientID].m_GameObject);
		
	}
}

//The server fires this RPC right before returning to the lobby
//however the client needs to notify the server when it is done first
@RPC function ShutdownMatch()
{
	if(GetGameObject() != null)
		GetGameObject().GetComponent(NetworkInputScript).enabled = false;
	m_SyncMsgsView.RPC("ClientShutdownMatch", RPCMode.Server,m_ClientID);
}


//a stub for calls to the server. The server recieves this call when the client notifies it has shutdown the match
@RPC function ClientShutdownMatch(clientID:int)
{
}

@RPC function ReturnToLobby()
{
	 m_LevelPrefix++;

        // There is no reason to send any more data over the network on the default channel,
        // because we are about to load the level, thus all those objects will get deleted anyway
        Network.SetSendingEnabled(0, false);    

        // We need to stop receiving because first the level must be loaded first.
        // Once the level is loaded, rpc's and other state update attached to objects in the level are allowed to fire
        Network.isMessageQueueRunning = false;
        
        // All network views loaded from a level will get a prefix into their NetworkViewID.
        // This will prevent old updates from clients leaking into a newly created scene.
         Network.SetLevelPrefix(m_LevelPrefix);
        Application.LoadLevel("MapSelectMenu");
        yield;
        yield;

        // Allow receiving data again
        Network.isMessageQueueRunning = true;
        // Now the level has been loaded and we can start sending out data to clients
        Network.SetSendingEnabled(0, true);
		GetComponent(MultiplayerLobbyGUI).enabled = true;
		GetComponent(MultiplayerLobbyGUI).ResetMenu(true);
}

function Update () {

	var mgr : GameStateManager = GetComponent(GameStateManager);
	
	if(mgr.m_CurrState == GameStateManager.MATCH_STARTING)
	{	
		//instantiate all connected clients' player prefabs
		for(var i : int = 0; i < GetNumClients(); i++)
		{
			//make sure the client doesnt already own a gameobject and make sure the level is loaded for them first too
			if(m_Clients[i].m_GameObject != null && m_Clients[i].m_LevelLoaded)
			{			
				m_Clients[i].m_GameObject.GetComponent(BeeControllerScript).m_ControlEnabled = false;
			}
		}
	}
	
}

function OnDestroy()
{
	Network.Disconnect();
}

function OnConnectedToServer()
{
	Debug.Log("Successfully connected to server");
	
	//Network.SetReceivingEnabled(Network.connections[0], 0, false);
	//
	//Network.SetReceivingEnabled(Network.connections[0], 1, false);
}

function OnDisconnectedFromServer()
{
	Cursor.visible = true;
	Application.LoadLevel("MultiplayerMainMenu");
	Destroy(gameObject);
}



//This function is called from the server whenever a client connects to the game
@RPC function ClientConnected( player : NetworkPlayer )
{
	
	var currClient : ClientNetworkInfo = new ClientNetworkInfo();
	currClient.m_ID = m_ClientCount;
	currClient.m_IPAddr = player.ipAddress;
	currClient.m_Port = player.port;
	
	if(m_Clients == null)
	{
		m_Clients = new ClientNetworkInfo[1];
		m_Clients[0] = currClient;
	}
	else
	{
		var vClients : Array = new Array(m_Clients);
		vClients.Push(currClient);
		m_Clients = vClients.ToBuiltin(ClientNetworkInfo) as ClientNetworkInfo[];
	}
	m_ClientCount++;
	
	Debug.Log("Player " + m_Clients[m_ClientCount-1].m_ID + 
				" connected : " + m_Clients[m_ClientCount-1].m_IPAddr + 
				":" +m_Clients[m_ClientCount-1].m_Port);
	
	//the connecting player is us!
	if(player == Network.player)
	{
		//since the server has acknowledged that we have joined
		//we should send our player name
		m_ClientID = currClient.m_ID;
		if(PlayerProfile.m_PlayerTag == "Player")
			PlayerProfile.m_PlayerTag += " "+(m_ClientID+1);
		var clr:Vector3 = Vector3(PlayerProfile.m_PlayerColor.r, PlayerProfile.m_PlayerColor.g, PlayerProfile.m_PlayerColor.b);
		m_ConnectMsgsView.RPC("RegisterPlayer", RPCMode.Server, PlayerProfile.m_PlayerTag, clr, m_ClientID);
	}
}

@RPC function ClientDisconnected(player : NetworkPlayer)
{
	var disIndex : int = -1;
	for(var i : int = 0; i < m_Clients.length; i++)
	{
		if(m_Clients[i].m_IPAddr == player.ipAddress &&
		   m_Clients[i].m_Port == player.port)
		   {
				disIndex = i;
				break;
		   }
	}
	
	if(disIndex != -1)
	{
		Debug.Log("Player " + m_Clients[disIndex].m_ID + " disconnected");
		var vClients : Array = new Array(m_Clients);
		if(GetClient(disIndex).m_GameObject != null)
			Destroy(GetClient(disIndex).m_GameObject);
		vClients.RemoveAt(disIndex);
		m_Clients = vClients.ToBuiltin(ClientNetworkInfo) as ClientNetworkInfo[];
		m_ClientCount--;
		if(disIndex == m_ClientID)
			m_ClientID = -1;
	}
}

@RPC function RegisterPlayer(name : String, skinColor:Vector3, color:Vector3, clientID : int)
{
	Debug.Log("Client " + clientID + " registered name: "+name);
	m_Clients[clientID].m_Name = name;
	m_Clients[clientID].m_Color = Color(color.x,color.y,color.z,1);
	m_Clients[clientID].m_SkinColor = Color(skinColor.x,skinColor.y,skinColor.z,1);
}

function GetNumClients() : int
{
	return m_ClientCount;
}

function GetClient(index : int) : ClientNetworkInfo
{
	return m_Clients[index];
}

function GetGameObject() : GameObject
{
	return GetClient(m_ClientID).m_GameObject;
}

@RPC function LoadLevel(level : String)
{
	m_LevelPrefix++;
	// There is no reason to send any more data over the network on the default channel,
	// because we are about to load the level, thus all those objects will get deleted anyway
	//Network.SetSendingEnabled(0, false);	
	// We need to stop receiving because first the level must be loaded first.
	// Once the level is loaded, rpc's and other state update attached to objects in the level are allowed to fire
	Network.isMessageQueueRunning = false;
	Network.SetLevelPrefix(m_LevelPrefix);
	Application.LoadLevel(level);
	Network.isMessageQueueRunning =true;

	m_SyncMsgsView.RPC("ClientLevelLoaded", RPCMode.Server, m_ClientID);
	Debug.Log("Client level loaded");
}

//this is a stub for calls to the server
@RPC function ClientLevelLoaded(clientID : int)
{
	
}

@RPC function NetworkInstantiate(prefabName : String, instName:String, pos : Vector3, rot : Quaternion, viewID : NetworkViewID,  group : int) : GameObject
{
	 var clone : GameObject;
     clone = gameObject.Instantiate(Resources.Load("GameObjects/"+prefabName), pos, rot);
	 var nView : NetworkView;
     nView = clone.GetComponent.<NetworkView>();
     nView.viewID = viewID;
	 if(instName != null && instName != "")
	 {
		clone.name = instName;
	 }
	 Debug.Log(instName);
	 return clone.gameObject;
}

@RPC function SetClientGameObject(clientID : int, go : String)
{
	if(clientID != -1)
	{
		Debug.Log("Setting GameObject for clientID: "+clientID);
		//we know the name of the bee that was jsut instantiated will be bee clone
		m_Clients[clientID].m_GameObject = gameObject.Find("Bee(Clone)");
		
		
		if(m_Clients[clientID].m_GameObject != null)
		{
			m_Clients[clientID].m_GameObject.GetComponent(NetworkInputScript).m_ClientOwner = clientID;
			if(NetworkUtils.IsControlledGameObject(m_Clients[clientID].m_GameObject))
			{
				Camera.main.GetComponent(CameraScript).SetFocalPosition(m_Clients[clientID].m_GameObject.transform.position);
			}
			
			
            //set the client gameObejct color			
			m_Clients[clientID].m_GameObject.GetComponent.<Renderer>().material.color = m_Clients[clientID].m_SkinColor;
					
		
			m_Clients[clientID].m_GameObject.name = go;
			if(clientID == m_ClientID)
			{
				//at this point we need to tell the server we are good to go
				//and have readied up (this is the last call in the RPC buffer that will exist for us at the time of game start)
				Debug.Log("Client "+m_ClientID+"  Readying up");
				GetComponent.<NetworkView>().RPC("ClientReadyUp", RPCMode.Server, m_ClientID);
			}
		}
	}
}

//this is a stub for a call to the server
@RPC function ClientReadyUp(clientID : int)
{
	
}

//this function makes a gameobject start receiving data across the network
@RPC function MakeGameObjectLive(name : String, viewID : NetworkViewID)
{
	
	var go : GameObject = gameObject.Find(name);
	//go.Destroy(go.collider);
	//go.GetComponent(Rigidbody).enabled = false;
	if(go.GetComponent(NetworkView) == null)
	{
		Debug.Log("Making Object live: " + name);
		go.AddComponent(typeof(NetworkView));
		go.GetComponent.<NetworkView>().viewID = viewID;
	}
	go.GetComponent.<NetworkView>().observed = go.GetComponent(UpdateScript) as UpdateScript;
	go.GetComponent.<NetworkView>().stateSynchronization = NetworkStateSynchronization.ReliableDeltaCompressed;
	
}

@RPC function MakeGameObjectLive2(name : String, viewID : NetworkViewID, pos : Vector3, rot : Quaternion, vel : Vector3)
{
	Debug.Log("Making Object live: " + name);
	var go : GameObject = gameObject.Find(name);
	go.transform.position = pos;
	go.transform.rotation = rot;
	go.GetComponent(UpdateScript).m_Vel = vel;
	//go.Destroy(go.collider);
	//go.GetComponent(Rigidbody).enabled = false;
	if(go.GetComponent(NetworkView) == null)
	{
		go.AddComponent(typeof(NetworkView));
		go.GetComponent.<NetworkView>().viewID = viewID;
	}
	go.GetComponent.<NetworkView>().observed = go.GetComponent(UpdateScript) as UpdateScript;
	go.GetComponent.<NetworkView>().stateSynchronization = NetworkStateSynchronization.ReliableDeltaCompressed;
	
}

@RPC function NetworkDestroy(name : String)
{
	Debug.Log("Network Destroy: "+name);
	Destroy(gameObject.Find(name));
}

//this function is useful for making function calls for objects who do not have their own network view
//but need some way to communicate from client to server and vice versa
@RPC function SendRPC(goTarget:String, func:String)
{
	 gameObject.Find(goTarget).SendMessage(func, null);
}