#pragma strict

import ClientNetworkInfo;

private var m_ClientCount : int = 0;
private var m_Clients : ClientNetworkInfo[];
private var m_LevelPrefix:int = 0;
//this is the prefab used for instantiating the player
var m_PlayerPrefab : GameObject = null;
var m_ConnectMsgsView : NetworkView;
var m_SyncMsgsView : NetworkView;
var m_GameplayMsgsView : NetworkView;

private var m_GameInProgress : boolean = false;


function Awake()
{
	//ServerRPC.m_RPCs[0] = new BufferedRPC();
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
	
	var useNat = !Network.HavePublicAddress();
	Debug.Log("Server Initializing...");	
	Network.InitializeServer(4, 66991, useNat);
	
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
		GUI.color = Color(0,0,0,0.75);
		 GUILayout.BeginArea(Rect(0,Screen.height*0.25, Screen.width,Screen.height*0.5), skin.customStyles[0]);
		 GUI.color = Color.white;
		// GUILayout.Label(" ", skin.label);
		 GUILayout.EndArea();
		
	}
	
}

function OnStateChange(state:int)
{
	var mgr : GameStateManager = GetComponent(GameStateManager);
	if(mgr.m_CurrState == GameStateManager.MATCH_STARTING)
	{
		// var flash : GameObject;
		// flash = gameObject.Instantiate(Resources.Load("GameObjects/ScreenFlash"), Vector3(0.5,0.5,0), Quaternion.identity);
		// flash.animation.Play("Flash");
	}
	else
	if(mgr.m_CurrState == GameStateManager.MATCH_PLAYING)
	{
		for(var i = 0; i < GetNumClients(); i++)
		{
			//make sure the client doesnt already own a gameobject and make sure the level is loaded for them first too
			if(m_Clients[i].m_GameObject != null && m_Clients[i].m_LevelLoaded)
			{			
				m_Clients[i].m_GameObject.GetComponent(BeeControllerScript).m_ControlEnabled = true;
				if(m_Clients[i].m_LocalClient)
					m_Clients[i].m_GameObject.GetComponent(BeeScript).SetGUIEnabled(true);
				Debug.Log("enabling input for "+i);
			}
		}

	}
	else
	if(mgr.m_CurrState == GameStateManager.MATCH_OVER)
	{
		for(i = 0; i < GetNumClients(); i++)
		{
			m_Clients[i].m_GameObject.GetComponent(UpdateScript).m_Vel = Vector3.zero;
			m_Clients[i].m_GameObject.GetComponent(NetworkInputScript).enabled = false;	
		}
		//after some time tell clients we are bumping out
		Screen.showCursor = true;
		//InitiateMatchShutdown();
		
		
	}
	else if(mgr.m_CurrState == GameStateManager.MATCH_LOBBY)
	{
		Debug.Log("Back At Lobby");
		ReturnToLobby();
	}
}

function InitiateMatchShutdown()
{
	
	//yield WaitForSeconds(14);
	
	GetComponent(GameStateManager).SetState(GameStateManager.MATCH_EXITING);
	Debug.Log("Initiate match shutdown called");
	//stop sending gameplay updates
	Network.SetSendingEnabled(0, false); 
	//tell everyone else to shutdown
	m_SyncMsgsView.RPC("ShutdownMatch", RPCMode.Others);
}

//this function is just a stub for calls to the client
@RPC function ShutdownMatch()
{
	
}

@RPC function ClientShutdownMatch(clientID:int)
{
	
	//this deletes any player instantiation etc, that needed to be executed after a client connected
	ServerRPC.DeleteFromBuffer(m_SyncMsgsView);
	//Rewmove any synced gameplay messages
	ServerRPC.DeleteFromBuffer(m_GameplayMsgsView.group);
	//remoev any buffered calls involving this object directly (adding swarm etc)
	ServerRPC.DeleteFromBuffer(m_Clients[clientID].m_GameObject);
	
	Destroy(m_Clients[clientID].m_GameObject);
	//Tell Client to enter lobby state
	m_SyncMsgsView.RPC("ExitMatch", m_Clients[clientID].m_Player);
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

	if(Input.GetKeyDown(KeyCode.O))
	{
		ServerRPC.Buffer(m_SyncMsgsView, "EndMatch",RPCMode.All, 1); 
	}
	
	if(Input.GetKeyDown(KeyCode.T))
	{
		ServerRPC.Buffer(m_SyncMsgsView, "DoMatchTick",RPCMode.All); 
	}

	var mgr : GameStateManager = GetComponent(GameStateManager);
	if(mgr.m_CurrState == GameStateManager.MATCH_STARTING)
	{	
		
		for(var i : int = 0; i < GetNumClients(); i++)
		{
			//make sure the client doesnt already own a gameobject and make sure the level is loaded for them first too
			if(m_Clients[i].m_GameObject != null && m_Clients[i].m_LevelLoaded && m_Clients[i].m_GameObject.GetComponent(BeeControllerScript).m_ControlEnabled )
			{			
				m_Clients[i].m_GameObject.GetComponent(BeeControllerScript).m_ControlEnabled = false;
			}
		}
	
	}
	else if(mgr.m_CurrState == GameStateManager.MATCH_EXITING)
	{
		//see if all clients have safely made it before we load the lobby ourselves
		var numClientsExited = 0;
		for(i = 0; i < GetNumClients(); i++)
		{
			if(GetClient(i).m_GameObject == null || GetClient(i).m_LocalClient){
					numClientsExited++;
			}
		}
		Debug.Log(numClientsExited+" "+GetNumClients());
		if(numClientsExited == GetNumClients())
		{
			Debug.Log("Exiting match from server");
			//ServerRPC.ClearBuffer();
			GetComponent(GameStateManager).ExitMatch();
		}
	}
	
}

function OnDestroy()
{
	Network.Disconnect();
    MasterServer.UnregisterHost();
}

function OnServerInitialized() {
	Debug.Log("Server initialized");
	//MasterServer.ipAddress = "127.0.0.1";
	Debug.Log(SystemInfo.deviceName);
	//MasterServer.RegisterHost("BeeHappy", SystemInfo.deviceName, "Bzzz death to all!");
	
	Debug.Log("Registering host with master server...");
	
	var plr : NetworkPlayer;
  // OnLocalPlayerConnected(plr, 0);
	// OnPlayerConnected(plr);
	 //OnPlayerConnected(plr);
	// OnPlayerConnected(plr);
	
	
	GetComponent(MultiplayerLobbyGUI).enabled = true;
}

function OnFailedToConnectToMasterServer(info : NetworkConnectionError) {

}

function OnMasterServerEvent(msEvent: MasterServerEvent) 
{    
	if (msEvent == MasterServerEvent.RegistrationSucceeded) 
	{
			
		Debug.Log("Server registered");
			
		
		
		//Destroy(this);
    }
}

function OnLocalPlayerConnected(player:NetworkPlayer, joyNum:int)
{	
	var currClient : ClientNetworkInfo = new ClientNetworkInfo();
	currClient.m_Player = player;
	currClient.m_ID = m_ClientCount;
	currClient.m_JoyNum = joyNum;
	currClient.m_IPAddr = player.ipAddress;
	currClient.m_Port = player.port;
	
	//add the new client to our array
	if(m_Clients == null)
	{
		m_Clients = new ClientNetworkInfo[1];
		m_Clients[0] = currClient;
	}
	else
	{
		for(var i:int = 0; i < m_Clients.length; i++)
		{
			if(m_Clients[i].m_JoyNum == joyNum)
				return;
		}
	
		var vClients : Array = new Array(m_Clients);
		vClients.Push(currClient);
		m_Clients = vClients.ToBuiltin(ClientNetworkInfo) as ClientNetworkInfo[];
	}
	m_ClientCount++;
	
	//log the message
	Debug.Log("Player " + m_Clients[m_ClientCount-1].m_ID + 
				" connected : " + m_Clients[m_ClientCount-1].m_IPAddr + 
				":" +m_Clients[m_ClientCount-1].m_Port);
	//this tells us the player is a local client
	ServerRPC.Buffer(m_ConnectMsgsView, "ClientConnected", RPCMode.Others, player);
	//if(PlayerProfile.m_PlayerTag == "Player")
	PlayerProfile.m_PlayerTag = "Player";
		PlayerProfile.m_PlayerTag += m_ClientCount.ToString();
	var clr:Vector3 = Vector3(PlayerProfile.m_PlayerColor.r, PlayerProfile.m_PlayerColor.g,PlayerProfile.m_PlayerColor.b);
	RegisterPlayer(PlayerProfile.m_PlayerTag,clr,clr, m_ClientCount-1);
	//return;
	
	//ServerRPC.Buffer(m_ConnectMsgsView, "ClientConnected", RPCMode.Others, player);
}

function OnPlayerConnected(player: NetworkPlayer) {
	
	//The server does not get this call
	//player 0 also includes all local players for local multiplayer game
	if(player.ToString() != "0")
	{
		Network.SetSendingEnabled(player, 0, false);
		Debug.Log("Disabling send for player: "+player);
	}
	
	var currClient : ClientNetworkInfo = new ClientNetworkInfo();
	currClient.m_Player = player;
	currClient.m_ID = m_ClientCount;
	currClient.m_IPAddr = player.ipAddress;
	currClient.m_Port = player.port;
	
	//add the new client to our array
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
	
	//log the message
	Debug.Log("Player " + m_Clients[m_ClientCount-1].m_ID + 
				" connected : " + m_Clients[m_ClientCount-1].m_IPAddr + 
				":" +m_Clients[m_ClientCount-1].m_Port);
	
	//The server is client 0, we dont send these to ourselves
	if(player.ToString() != "0")	
	{
		//first we must execute everything in the buffer for this player, the group keeps track of certain types of messages
		//in this case we are handling connection\disconnection info
		ServerRPC.ExecuteBuffer(player, m_ConnectMsgsView.group);
		//tell all the other clients someone has joined
	
	}
	else
	{
		//this tells us the player is a local client
		ServerRPC.Buffer(m_ConnectMsgsView, "ClientConnected", RPCMode.Others, player);
		//if(PlayerProfile.m_PlayerTag == "Player")
		PlayerProfile.m_PlayerTag = "Player";
			PlayerProfile.m_PlayerTag += m_ClientCount.ToString();
		var clr:Vector3 = Vector3(PlayerProfile.m_PlayerColor.r, PlayerProfile.m_PlayerColor.g,PlayerProfile.m_PlayerColor.b);
		RegisterPlayer(PlayerProfile.m_PlayerTag,clr,clr, m_ClientCount-1);
		return;
	}
	ServerRPC.Buffer(m_ConnectMsgsView, "ClientConnected", RPCMode.Others, player);
}

//stub for calls to the client to let them know a player has connected
@RPC function ClientConnected( player : NetworkPlayer )
{
}

function OnPlayerDisconnected(player : NetworkPlayer)
{
	Network.RemoveRPCs(player);
    Network.DestroyPlayerObjects(player);
	
	//first find the client to remove
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
	
	//if the index is valid remove the client and log the message
	if(disIndex != -1)
	{
		Debug.Log("Client " + m_Clients[disIndex].m_ID + " disconnected");
		var vClients : Array = new Array(m_Clients);
		if(GetClient(disIndex).m_GameObject != null)
		{
			ServerRPC.DeleteFromBuffer(GetClient(disIndex).m_GameObject);
			Destroy(GetClient(disIndex).m_GameObject);
		}
		vClients.RemoveAt(disIndex);
		m_Clients = vClients.ToBuiltin(ClientNetworkInfo) as ClientNetworkInfo[];
		m_ClientCount--;
		
		//let the others know that the client has been dropped
		//m_ConnectMsgsView.RPC("ClientDisconnected", RPCMode.OthersBuffered, player);
		ServerRPC.Buffer(m_ConnectMsgsView, "ClientDisconnected", RPCMode.Others, player);
	}
}

function GetNumClients() : int
{
	return m_ClientCount;
}

function GetClient(index : int) : ClientNetworkInfo
{
	if(m_Clients == null || m_Clients.length <= index)
		return null;
	return m_Clients[index];
}

function GetGameObject() : GameObject
{
	return GetClient(0).m_GameObject;
}

//This function allows the server to make a gameobject live in one call
// function NetworkActivateGameObject(name : String)
// {	
	// Debug.Log("Making Object live: " + name);
	// var go : GameObject = gameObject.Find(name);
	// if(go.GetComponent(NetworkView) == null)
	// {
		// var viewID : NetworkViewID = Network.AllocateViewID();
		// go.AddComponent(typeof(NetworkView));
		// go.networkView.viewID = viewID;
	// }
	// go.networkView.observed = go.GetComponent(UpdateScript) as UpdateScript;
	// go.networkView.stateSynchronization = NetworkStateSynchronization.ReliableDeltaCompressed;
	// ServerRPC.Buffer(m_GameplayMsgsView, "MakeGameObjectLive", RPCMode.Others, go.name, viewID);
// }

// function NetworkActivateGameObject(name : String, pos : Vector3, rot : Quaternion, vel : Vector3)
// {
	// Debug.Log("Making Object live: " + name);
	// var go : GameObject = gameObject.Find(name);
	// if(go.GetComponent(NetworkView) == null)
	// {
		// var viewID : NetworkViewID = Network.AllocateViewID();
		// go.AddComponent(typeof(NetworkView));
		// go.networkView.viewID = viewID;
	// }
	// go.networkView.observed = go.GetComponent(UpdateScript) as UpdateScript;
	// go.networkView.stateSynchronization = NetworkStateSynchronization.ReliableDeltaCompressed;
	// ServerRPC.Buffer(m_GameplayMsgsView, "MakeGameObjectLive2", RPCMode.Others, go.name, viewID, pos, rot, vel);
// }

//stub for calls to client
@RPC function MakeGameObjectLive(name : String, viewID : NetworkViewID)
{
	
}

//stub for calls to client
@RPC function MakeGameObjectLive2(name : String, viewID : NetworkViewID, pos : Vector3, rot : Quaternion, vel : Vector3)
{
	
}

//RPC to handle network instantiation
@RPC function NetworkInstantiate(prefabName : String, instName:String, pos : Vector3, rot : Quaternion, viewID : NetworkViewID,  group : int) : GameObject
{
	 var clone : GameObject;
     clone = gameObject.Instantiate(Resources.Load("GameObjects/"+prefabName), pos, rot);
	 clone.transform.position = pos;
	 clone.transform.rotation = rot;
	 var nView : NetworkView;
     nView = clone.networkView;
     nView.viewID = viewID;
	 return clone.gameObject;
}

@RPC function NetworkDestroy(name : String)
{
	Destroy(gameObject.Find(name));
	ServerRPC.DeleteFromBuffer(gameObject.Find(name));	

	
}



//stub for client calls
@RPC function ClientDisconnected(player : NetworkPlayer)
{
	
}

//server side RPC for level loading, the server does not call this via RPC however it does on the client
@RPC function LoadLevel(level : String)
{
	m_LevelPrefix++;
	//don't draw the lobby gui anymore
	if(GetComponent(MultiplayerLobbyGUI) != null)
		GetComponent(MultiplayerLobbyGUI).enabled = false;
	// There is no reason to send any more data over the network on the default channel,
	// because we are about to load the level, thus all those objects will get deleted anyway
	//Network.SetSendingEnabled(0, false);	

	// We need to stop receiving because first the level must be loaded first.
	// Once the level is loaded, rpc's and other state update attached to objects in the level are allowed to fire
	Network.isMessageQueueRunning = false;
	Network.SetLevelPrefix(m_LevelPrefix);
	Application.LoadLevel(level);
	
	Network.isMessageQueueRunning = true;
	//Network.SetSendingEnabled(0, true);
	yield; 
	yield;
	//Fire this off since we treat the server as a client as well (clientID 0)
	for(var i = 0; i < m_Clients.length; i++)
	{
		if(m_Clients[i].m_Player.ToString() == "0")
			ClientLevelLoaded(i);
	}
	
	GetComponent(GameStateManager).StartMatchTick(4,0.66);
	ServerRPC.Buffer(m_SyncMsgsView,"StartMatchTick", RPCMode.Others, 4,0.66);
	m_GameInProgress = true;
	
}

//this is called from the client to acknowledge they have indeed finished loading a level
@RPC function ClientLevelLoaded(clientID : int)
{
	if(clientID == -1)
	{
		Debug.Log("Invalid client loaded level");
		return;
	}
	m_Clients[clientID].m_LevelLoaded = true;
	Debug.Log("Client " + clientID + " finished loading level");
	
	//we can now start receiving data such as object instantiation
	//just dont call this on ourself since we are the server
	if(m_Clients[clientID].m_Player.ToString() != "0")
	{
		ServerRPC.ExecuteBuffer(m_Clients[clientID].m_Player, m_SyncMsgsView.group);
	}
	
	Debug.Log("Instantiating gameobject for player " +clientID);
	var viewID : NetworkViewID= Network.AllocateViewID();
	Debug.Log("ViewID "+viewID);
	var go : GameObject = NetworkInstantiate(m_PlayerPrefab.name,"", Vector3.up, Quaternion.identity, viewID ,  0);
	
	//go.AddComponent(ControlDisablerDecorator);
	ServerRPC.Buffer(m_SyncMsgsView, "NetworkInstantiate", RPCMode.Others, m_PlayerPrefab.name,"", go.transform.position, Quaternion.identity, viewID, 0);
	go.name = m_Clients[clientID].m_Name; 
	SetClientGameObject(clientID,go.name);
	ServerRPC.Buffer(m_SyncMsgsView, "SetClientGameObject", RPCMode.Others, clientID, go.name);
	ServerRPC.Buffer(go.networkView, "AddSwarm", RPCMode.All, "", Vector3(0,0,0), go.GetComponent(BeeControllerScript).m_LoadOut.m_BaseClipSize);
	Debug.Log(go.GetComponent(BeeControllerScript).m_ControlEnabled);
	//ServerRPC.Buffer(go.networkView, "Reload", RPCMode.All);
	//ServerRPC.Buffer(go.networkView, "QuickReload", RPCMode.All);
}

//This RPC is calld from clients on the server and then the server publishes the same RPC to clients
@RPC function RegisterPlayer(name : String, skinColor:Vector3, color:Vector3, clientID : int)
{
	if(clientID < 0)
		return;
	Debug.Log("Client " + clientID + " registered name " +name);
	m_Clients[clientID].m_Name = name;
	m_Clients[clientID].m_SkinColor = Color(skinColor.x,skinColor.y,skinColor.z,1);
	m_Clients[clientID].m_Color = Color(color.x,color.y,color.z,1);
	ServerRPC.Buffer(m_ConnectMsgsView, "RegisterPlayer", RPCMode.Others, name, skinColor, color, clientID);
	
	//if a game is already in progress we should send the level to the client
	if(m_GameInProgress && !Application.isLoadingLevel && m_Clients[clientID].m_Player.ToString() != "0")
		m_ConnectMsgsView.RPC("LoadLevel", m_Clients[clientID].m_Player, "Scene2");
}



@RPC function SetClientGameObject(clientID : int, go : String)
{
	if(clientID != -1)
	{
		m_Clients[clientID].m_GameObject = gameObject.Find(go);
		m_Clients[clientID].m_GameObject.GetComponent(NetworkInputScript).m_ClientOwner = clientID;
		m_Clients[clientID].m_GameObject.transform.position = m_Clients[clientID].m_GameObject.GetComponent(BeeScript).FindRespawnLocation();
		m_Clients[clientID].m_GameObject.transform.position.y = m_Clients[clientID].m_GameObject.GetComponent(CharacterController).height;
		if(m_Clients[clientID].m_Player.ToString() == "0")
		{
			//tell the input system it is dealing with a local client
			m_Clients[clientID].m_LocalClient = true;
			m_Clients[clientID].m_GameObject.GetComponent(NetworkInputScript).m_JoyOwner = m_Clients[clientID].m_JoyNum;
			m_Clients[clientID].m_GameObject.GetComponent(NetworkInputScript).m_LocalClient = true;
			m_Clients[clientID].m_GameObject.GetComponent(BeeScript).SetGUIEnabled(false);
			//instantiate a new camera for this player to render on screen (split screen)
			var playerCam:GameObject = GameObject.Instantiate(Resources.Load("GameObjects/PlayerCamera"));
			playerCam.name = go + "Camera";
			if(clientID ==0)
			{
				playerCam.camera.cullingMask &= (~(1<<LayerMask.NameToLayer("GUILayer_P2") | 1 <<LayerMask.NameToLayer("GUILayer_P3") | 1<<LayerMask.NameToLayer("GUILayer_P4")));
			}
			else
			if(clientID ==1)
			{
				playerCam.camera.cullingMask &= (~(1<<LayerMask.NameToLayer("GUILayer_P1") | 1 <<LayerMask.NameToLayer("GUILayer_P3") | 1<<LayerMask.NameToLayer("GUILayer_P4")));
			}
			else
			if(clientID ==2)
			{
				playerCam.camera.cullingMask &= (~(1<<LayerMask.NameToLayer("GUILayer_P1") | 1 <<LayerMask.NameToLayer("GUILayer_P2") | 1<<LayerMask.NameToLayer("GUILayer_P4")));
			}
			else
			if(clientID ==3)
			{
				playerCam.camera.cullingMask &= (~(1<<LayerMask.NameToLayer("GUILayer_P1") | 1 <<LayerMask.NameToLayer("GUILayer_P2") | 1<<LayerMask.NameToLayer("GUILayer_P3")));
			}
			playerCam.GetComponent(CameraScript).m_Target = m_Clients[clientID].m_GameObject;
			m_Clients[clientID].m_GameObject.GetComponent(BeeScript).m_Camera = playerCam;
			m_Clients[clientID].m_GameObject.GetComponent(BeeScript).m_Team = m_Clients[clientID].m_Side;
			//perform calculations for screen rects for each camera
			var numLocalClients:int = 0;
		
			//count local clients and adjust the cameras accordingly
			for(var i:int = 0; i < m_Clients.length; i++)
			{
				if(m_Clients[i].m_GameObject && m_Clients[i].m_GameObject.GetComponent(NetworkInputScript).m_LocalClient)
					numLocalClients++;
			}
			
			
			var localCount:int = 0;
			var onePixX = 1.0/Screen.width;
			var onePixY= 1.0/Screen.height;
			onePixX = onePixY;
			var camRect :Rect;
			var minimapCam:Camera;
			if(numLocalClients == 1)
			{
			}
			else if(numLocalClients == 2)
			{
				for(i= 0; i < m_Clients.length; i++)
				{
					if(m_Clients[i].m_GameObject && m_Clients[i].m_GameObject.GetComponent(NetworkInputScript).m_LocalClient)
					{
						if(localCount == 0)
							camRect = new Rect(0,0.5+onePixY,1,0.5-onePixY);
						else if(localCount == 1)
							camRect = new Rect(0,0-onePixY,1,0.5-onePixY);
						GameObject.Find(m_Clients[i].m_GameObject.name+"Camera").GetComponent(Camera).rect = camRect;
						minimapCam = GameObject.Find(m_Clients[i].m_GameObject.name+"/MinimapCamera").GetComponent(Camera);
						minimapCam.rect.x = camRect.x + 0.02;
						minimapCam.rect.y = camRect.y + camRect.height - 0.02 - minimapCam.rect.height;
						localCount++;
					}		
				}
			}
			else if(numLocalClients == 3)
			{
				for(i= 0; i < m_Clients.length; i++)
				{
					if(m_Clients[i].m_GameObject && m_Clients[i].m_GameObject.GetComponent(NetworkInputScript).m_LocalClient)
					{
						var offset:float = 0;
						if(localCount == 0)
							camRect = new Rect(0,0.5+onePixY,1,0.5-onePixY);
						else if(localCount == 1)
						{
							camRect = new Rect(0,0-onePixY,0.5-onePixX,0.5-onePixY);
							GameObject.Find(m_Clients[i].m_GameObject.name+"Camera").GetComponent(Camera).fov = 48;
							offset = -0.05;
						}
						else if(localCount == 2)
						{
							camRect = new Rect(0.5+onePixX,0-onePixY,0.5-onePixX,0.5-onePixY);
							GameObject.Find(m_Clients[i].m_GameObject.name+"Camera").GetComponent(Camera).fov = 48;
							offset = -0.05;
						}
						GameObject.Find(m_Clients[i].m_GameObject.name+"Camera").GetComponent(Camera).rect = camRect;
						minimapCam = GameObject.Find(m_Clients[i].m_GameObject.name+"/MinimapCamera").GetComponent(Camera);
						minimapCam.rect.width += offset;
						minimapCam.rect.height += offset;
						minimapCam.rect.x = camRect.x + 0.02;
						minimapCam.rect.y = camRect.y + camRect.height - 0.02 - minimapCam.rect.height;
						localCount++;
					}	
				}
			}
			else if(numLocalClients == 4)
			{
				for(i= 0; i < m_Clients.length; i++)
				{
					if(m_Clients[i].m_GameObject && m_Clients[i].m_GameObject.GetComponent(NetworkInputScript).m_LocalClient)
					{
						minimapCam = GameObject.Find(m_Clients[i].m_GameObject.name+"/MinimapCamera").GetComponent(Camera);
						if(localCount == 0)
						{
							camRect = new Rect(0,0.5+onePixY,0.5-onePixX,0.5-onePixY);
							minimapCam.rect.width -= 0.05;
							minimapCam.rect.height -= 0.05;
						}
						else if(localCount == 1)
							camRect = new Rect(0.5+onePixX,0.5+onePixY,0.5-onePixX,0.5-onePixY);
						else if(localCount == 2)
							camRect = new Rect(0,0-onePixY,0.5-onePixX,0.5-onePixY);
						else if(localCount == 3)
						{
							camRect = new Rect(0.5+onePixX,0-onePixY,0.5-onePixX,0.5-onePixY);
							minimapCam.rect.width -= 0.05;
							minimapCam.rect.height -= 0.05;
						}
						GameObject.Find(m_Clients[i].m_GameObject.name+"Camera").GetComponent(Camera).rect = camRect;
						GameObject.Find(m_Clients[i].m_GameObject.name+"Camera").GetComponent(Camera).fov = 48;
						
						//minimapCam.rect.width -= 0.05;
						//minimapCam.rect.height -= 0.05;
						minimapCam.rect.x = camRect.x + 0.02;
						minimapCam.rect.y = camRect.y + camRect.height - 0.02 - minimapCam.rect.height;
						
						localCount++;
					}
						
				}
			}
		}
		//set the client gameObejct color and facial features			
		m_Clients[clientID].m_GameObject.GetComponent(BeeScript).SetColor(m_Clients[clientID].m_SkinColor);
		m_Clients[clientID].m_GameObject.GetComponent(BeeBlinkScript).SetLookIndexes(m_Clients[clientID].m_EyeIndex,m_Clients[clientID].m_MouthIndex);
		
		var mapIcon:GameObject = m_Clients[clientID].m_GameObject.transform.Find("Bee_Minimap").gameObject;
		mapIcon.renderer.material.SetColor("_TintColor", m_Clients[clientID].m_Color);
		
		var armor:GameObject = m_Clients[clientID].m_GameObject.transform.Find("Bee/NewBee/BeeArmor").gameObject;
		armor.renderer.materials[0].color = m_Clients[clientID].m_Color;
		if(m_Clients[clientID].m_Side == 0)
			GameStateManager.m_Team1Color = m_Clients[clientID].m_Color;
		else
			GameStateManager.m_Team2Color = m_Clients[clientID].m_Color;
			
		
		
		
		var body:Transform = m_Clients[clientID].m_GameObject.transform.Find("Bee/NewBee/NewBee");
		var hand:Transform = m_Clients[clientID].m_GameObject.transform.Find("Bee/NewBee/body/r_shoulder/r_arm/r_hand");
		
		var gun:GameObject;
		
		if(m_Clients[clientID].m_Swag == "Scout")
			gun	= GameObject.Instantiate(Resources.Load("GameObjects/Shotgun"));
		else if(m_Clients[clientID].m_Swag == "Guardian")
			gun	= GameObject.Instantiate(Resources.Load("GameObjects/RocketLauncher"));
		else if(m_Clients[clientID].m_Swag == "Saboteur")
			gun	= GameObject.Instantiate(Resources.Load("GameObjects/SniperRifle"));
		else if(m_Clients[clientID].m_Swag == "Raider")
			gun	= GameObject.Instantiate(Resources.Load("GameObjects/AssaultRifle1"));
		else
			gun	= GameObject.Instantiate(Resources.Load("GameObjects/AssaultRifle"));
		gun.transform.parent = hand;
		gun.transform.position = hand.position;
		gun.transform.localScale = Vector3(1,1,1);
		gun.transform.localEulerAngles.z = -90;
		gun.name = "gun";
		gun.GetComponent(WeaponScript).m_Owner = m_Clients[clientID].m_GameObject;
		m_Clients[clientID].m_GameObject.GetComponent(BeeScript).m_Weapon = gun;
		
		if(m_Clients[clientID].m_Swag != "")
		{
			Debug.Log("SWAGGING "+m_Clients[clientID].m_Swag);
			var swag:GameObject = GameObject.Instantiate(Resources.Load("GameObjects/Swag"));
			var swagPiece:GameObject = swag.transform.Find(m_Clients[clientID].m_Swag).gameObject;
			var head:GameObject = m_Clients[clientID].m_GameObject.transform.Find("Bee/NewBee/body/head").gameObject;
			swagPiece.transform.parent = head.transform;
			swagPiece.transform.position = head.transform.position;
			swagPiece.transform.rotation = head.transform.rotation;
			swagPiece.transform.localEulerAngles.z = 180;
			swagPiece.transform.localScale = Vector3(1,1,1);
			swagPiece.name = "swag";
			Destroy(swag);
			
		}
		if(NetworkUtils.IsControlledGameObject(m_Clients[clientID].m_GameObject))
		{
			Camera.main.GetComponent(CameraScript).SetFocalPosition(m_Clients[clientID].m_GameObject.transform.position);
			m_Clients[clientID].m_GameObject.GetComponent(NetworkInputScript).m_CursorPosition = m_Clients[clientID].m_GameObject.transform.position + m_Clients[clientID].m_GameObject.transform.forward*10;
		}
		
		
	}
}

//a client is letting us know they are ready (meaning the level is loaded on their end and their player object is instantiated)
@RPC function ClientReadyUp(clientID : int)
{
	Debug.Log("Client "+clientID+ "readyied up");
	if(clientID != -1)
	{
		Network.SetSendingEnabled(m_Clients[clientID].m_Player, 0, true);
		Debug.Log("Executing gameobejct buffer on client "+clientID);
		ServerRPC.ExecuteBuffer(m_Clients[clientID].m_Player, 0);
	}
}

//this function is useful for making function calls for objects who do not have their own network view
//but need some way to communicate from client to server and vice versa
@RPC function SendRPC(goTarget:String, func:String)
{
	 gameObject.Find(goTarget).SendMessage(func, null);
}




