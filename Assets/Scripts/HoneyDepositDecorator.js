#pragma strict
var m_Lifetime:float = 1;
var m_PollenCount : int = 0;
var m_PollenParticles:GameObject = null;
var m_Hive: GameObject = null;
function Start () {

	gameObject.AddComponent(ControlDisablerDecorator);
	GetComponent(ControlDisablerDecorator).SetLifetime(m_Lifetime);
	
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		Camera.main.GetComponent(CameraScript).Shake(m_Lifetime,0.5 );
		Camera.main.animation["CameraDramaticZoom"].speed = 1;
		Camera.main.animation.Play("CameraDramaticZoom");
	}

	gameObject.Find("Swarm"+gameObject.name).renderer.enabled = false;

}

function Update () {

	transform.position = m_Hive.transform.position + Vector3.up *20;
	
	if(m_Lifetime > 0)
		m_Lifetime -= Time.deltaTime;
	else
		if(Network.isServer)
			ServerRPC.Buffer(networkView,"RemoveComponent", RPCMode.All, "HoneyDepositDecorator");

}

function OnDestroy()
{
	gameObject.Find("Swarm"+gameObject.name).renderer.enabled = true;
	var bonus = m_PollenCount / 3 * 50;
	gameObject.GetComponent(BeeScript).m_Money +=  bonus;
	
	if(Network.isServer)
	{
		if(gameObject.GetComponent(BeeScript).m_Honey >= GameStateManager.m_PointsToWin)
		{
			var server = GameObject.Find("GameServer");
			var winner:int = NetworkUtils.GetClientFromGameObject(gameObject);
			ServerRPC.Buffer(server.GetComponent(ServerScript).m_SyncMsgsView, "EndMatch",RPCMode.All, winner); 
		}
	}
	
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		Camera.main.animation["CameraDramaticZoom"].time = Camera.main.animation["CameraDramaticZoom"].length;
		Camera.main.animation["CameraDramaticZoom"].speed = -1;
		Camera.main.animation.Play("CameraDramaticZoom");
		Camera.main.GetComponent(CameraScript).Shake(0.5,0.5 );
		if(bonus > 0)
		{	
			var txt : GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/KudosText"));
			txt.GetComponent(KudosTextScript).m_Pos = transform.position;
			txt.GetComponent(UpdateScript).m_Lifetime = 2;
			txt.GetComponent(GUIText).text = m_PollenCount+"x Bonus $"+bonus;
			txt.GetComponent(GUIText).material.color = Color.yellow;
		}
	}
		
	
}