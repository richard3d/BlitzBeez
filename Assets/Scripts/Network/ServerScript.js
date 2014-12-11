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
		GUILayout.BeginArea(Rect(0,Screen.height*0.25, Screen.width,Screen.height*0.5), skin.customStyles[0]);
		GUILayout.Label("Match starting in "+(mgr.m_MatchTick)+"...", skin.label);
		GUILayout.EndArea();
	
	}
	else
	if(mgr.m_CurrState == GameStateManager.MATCH_OVER)
	{
		skin = GetComponent(MultiplayerLobbyGUI).m_GUISkin;
		GUILayout.BeginArea(Rect(0,Screen.height*0.25, Screen.width,Screen.height*0.5), skin.customStyles[0]);
		GUILayout.Label("All Hail "+m_Clients[GameStateManager.m_WinningPlayer].m_Name+".\n The new QUEEN (OR KING) BEE!", skin.label);
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
		InitiateMatchShutdown();
		
		
	}
	else if(mgr.m_CurrState == GameStateManager.MATCH_LOBBY)
	{
		Debug.Log("Back At Lobby");
		ReturnToLobby();
	}
}

function InitiateMatchShutdown()
{
	
	yield WaitForSeconds(10);
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
	GetComponent(MultiplayerLobbyGUI).ResetMenu();
}

function Update () {

	if(Input.GetKeyDown(KeyCode.O))
	{
		ServerRPC.Buffer(m_SyncMsgsView, "EndMatch",RPCMode.All, 0); 
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
			if(m_Clients[i].m_GameObject != null && m_Clients[i].m_LevelLoaded)
			{			
				Debug.Log("killing input for "+i);
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
			if(GetClient(i).m_GameObject == null){
					numClientsExited++;
			}
		}
		Debug.Log(numClientsExited+" "+GetNumClients());
		if(numClientsExited == GetNumClients()-1)
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
	MasterServer.RegisterHost("BeeHappy", 
		SystemInfo.deviceName, "Bzzz death to all!");
	
	Debug.Log("Registering host with master server...");
	
	var plr : NetworkPlayer;
	OnPlayerConnected(plr);
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



function OnPlayerConnected(player: NetworkPlayer) {
	
	//The server does not get this call
	if(m_ClientCount != 0)
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
	if(currClient.m_ID != 0)	
	{
		//first we must execute everything in the buffer for this player, the group keeps track of certain types of messages
		//in this case we are handling connection\disconnection info
		ServerRPC.ExecuteBuffer(player, m_ConnectMsgsView.group);
		//tell all the other clients someone has joined
	
	}
	else
	{
		ServerRPC.Buffer(m_ConnectMsgsView, "ClientConnected", RPCMode.Others, player);
		if(PlayerProfile.m_PlayerTag == "Player")
			PlayerProfile.m_PlayerTag += " 1";
		var clr:Vector3 = Vector3(PlayerProfile.m_PlayerColor.r, PlayerProfile.m_PlayerColor.g,PlayerProfile.m_PlayerColor.b);
		RegisterPlayer(PlayerProfile.m_PlayerTag,clr, 0);
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
	ClientLevelLoaded(0);
	GetComponent(GameStateManager).StartMatchTick(5,1);
	ServerRPC.Buffer(m_SyncMsgsView,"StartMatchTick", RPCMode.Others, 5,1);
	m_GameInProgress = true;
	
}

//this is called from the client to acknowledge they have indeed finished loading a level
@RPC function ClientLevelLoaded(clientID : int)
{
	if(clientID == -1)
		Debug.Log("Invalid client loaded level");
	m_Clients[clientID].m_LevelLoaded = true;
	Debug.Log("Client " + clientID + " finished loading level");
	
	//we can now start receiving data such as object instantiation
	//just dont call this on ourself since we are the server
	if(clientID != 0)
	{
		ServerRPC.ExecuteBuffer(m_Clients[clientID].m_Player, m_SyncMsgsView.group);
	}
	
	Debug.Log("Instantiating gameobject for player " +clientID);
	var viewID : NetworkViewID= Network.AllocateViewID();
	Debug.Log("ViewID "+viewID);
	var go : GameObject = NetworkInstantiate(m_PlayerPrefab.name,"", Vector3.up, Quaternion.identity, viewID ,  0);
	go.transform.position = go.GetComponent(BeeScript).FindRespawnLocation();
	go.transform.position.y = 7;
	//go.AddComponent(ControlDisablerDecorator);
	ServerRPC.Buffer(m_SyncMsgsView, "NetworkInstantiate", RPCMode.Others, m_PlayerPrefab.name,"", go.transform.position, Quaternion.identity, viewID, 0);
	go.name = "Bee" + clientID; 
	SetClientGameObject(clientID,go.name);
	ServerRPC.Buffer(m_SyncMsgsView, "SetClientGameObject", RPCMode.Others, clientID, go.name);
	ServerRPC.Buffer(go.networkView, "AddSwarm", RPCMode.All, "", Vector3(0,0,0), go.GetComponent(BeeControllerScript).m_LoadOut.m_BaseClipSize);
	Debug.Log(go.GetComponent(BeeControllerScript).m_ControlEnabled);
	//ServerRPC.Buffer(go.networkView, "Reload", RPCMode.All);
	//ServerRPC.Buffer(go.networkView, "QuickReload", RPCMode.All);
}

//This RPC is calld from clients on the server and then the server publishes the same RPC to clients
@RPC function RegisterPlayer(name : String, color:Vector3, clientID : int)
{
	if(clientID < 0)
		return;
	Debug.Log("Client " + clientID + " registered name " +name);
	m_Clients[clientID].m_Name = name;
	m_Clients[clientID].m_Color = Color(color.x,color.y,color.z,1);
	ServerRPC.Buffer(m_ConnectMsgsView, "RegisterPlayer", RPCMode.Others, name,color, clientID);
	
	//if a game is already in progress we should send the level to the client
	if(m_GameInProgress && !Application.isLoadingLevel)
		m_ConnectMsgsView.RPC("LoadLevel", m_Clients[clientID].m_Player, "Scene2");
}

@RPC function SetClientGameObject(clientID : int, go : String)
{
	if(clientID != -1)
	{
		m_Clients[clientID].m_GameObject = gameObject.Find(go);
		m_Clients[clientID].m_GameObject.GetComponent(NetworkInputScript).m_ClientOwner = clientID;
		//set the client gameObejct color			
		m_Clients[clientID].m_GameObject.renderer.material.color = m_Clients[clientID].m_Color;
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




