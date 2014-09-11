#pragma strict


static var m_HostListTimeout : float = 10;
private var m_HostListWaitTimer : float = 0;

function Start () {

	GetHosts();

}

function GetHosts()
{
	//MasterServer.ipAddress = "127.0.0.1";
	MasterServer.RequestHostList("BeeHappy");
	m_HostListWaitTimer = m_HostListTimeout;
}

function Update () {

	if(Input.GetKeyDown(KeyCode.Escape))
	{
		gameObject.Destroy(gameObject.Find("GameClient"));
		Application.LoadLevel(0);
	}

}

function OnGUI()
{
	var data : HostData[] = MasterServer.PollHostList();
	
	if(GUILayout.Button("Refresh ServerList"))
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
		GUILayout.BeginHorizontal();	
		var name = element.gameName + " " + element.connectedPlayers + " / " + element.playerLimit;
		GUILayout.Label(name);	
		GUILayout.Space(5);
		var hostInfo : String;
		hostInfo = "[";
		for (var host in element.ip)
			hostInfo = hostInfo + host + ":" + element.port + " ";
		hostInfo = hostInfo + "]";
		GUILayout.Label(hostInfo);	
		GUILayout.Space(5);
		GUILayout.Label(element.comment);
		GUILayout.Space(5);
		GUILayout.FlexibleSpace();
		if (GUILayout.Button("Connect"))
		{
			// Connect to HostData struct, internally the correct method is used (GUID when using NAT).
			Debug.Log("fuck");
			Network.Connect(element);
			this.enabled = false;			
		
		}
		GUILayout.EndHorizontal();	
	}
	
	var width : float = 100;
	GUILayout.BeginArea (Rect(Screen.width*0.5 - width* 0.5, Screen.height * 0.5, width,width));
	
	GUILayout.EndArea();
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