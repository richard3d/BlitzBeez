#pragma strict
private var m_Lifetime : float = 0.0;
private var m_AnimTime : float = 0.25;
private var m_OrigScale = Vector3(1,1,1);
private var m_WaterHeight :float;
function Awake()
{
	m_Lifetime = 0.20;
	
	
	GetComponent(BeeScript).Show(false);
	GetComponent.<Collider>().enabled = false;
	
	//GetComponentInChildren(Projector).enabled = false;
	//GetComponentInChildren(ParticleRenderer).enabled = false;
}

function Start () {

	gameObject.AddComponent(ControlDisablerDecorator);
	 if(GetComponent(ItemDecorator) != null)
	 {	//GetComponent(ItemDecorator).m_ThrowVelocityScalar = 1;
		Destroy(GetComponent(ItemDecorator).GetItem());
		 Destroy(GetComponent(ItemDecorator));
	 }
	 
	 if(GetComponent(HammerDecorator) != null)
	 {	
		 Destroy(GetComponent(HammerDecorator));
	 }
	 
	var trgt : Transform = transform.Find("PowerShotEffect");
	if(trgt != null)
		Destroy(trgt.gameObject);
		
	var go:GameObject = gameObject.Instantiate(Resources.Load("GameObjects/SplashParticles"));
	go.transform.position = GetComponent(TerrainCollisionScript).m_TerrainInfo.point;
	m_WaterHeight = go.transform.position.y;
	//go.transform.position.y = 1;
	m_OrigScale = transform.localScale;
		
	

}

function Update () {
	
	GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
	GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
	gameObject.GetComponent(BeeScript).enabled = false;
	if(m_Lifetime > 0.0)
	{
		m_Lifetime -= Time.deltaTime;
		//gameObject.GetComponent(BeeScript).enabled = false;
		//transform.position = Vector3(transform.position.x, Mathf.Lerp(transform.position.y, m_WaterHeight, 1-m_Lifetime/1.5), transform.position.z);
		if(Mathf.Abs(transform.position.y - m_WaterHeight) < 1)
			GetComponent(BeeScript).Show(false);
		//transform.localScale = Vector3(Mathf.Lerp(transform.localScale.x, 0, 1-m_Lifetime/1.5), Mathf.Lerp(transform.localScale.y, 0, 1-m_Lifetime/1.5), Mathf.Lerp(transform.localScale.z, 0, 1-m_Lifetime/1.5));
		if(m_Lifetime <= 0.0)
		{		
			//respawn
			if(Network.isServer)
			 {
				 GetComponent(BeeScript).KillAndRespawn(false);
				 //var pos:Vector3 = GetComponent(BeeScript).FindRespawnLocation();
				 //networkView.RPC("Respawn", RPCMode.All,pos);
				//ServerRPC.Buffer(networkView,"RemoveComponent", RPCMode.All, "DrowningDecorator");
			 }
		}
	}
	
	
}

function SetLifetime(time : float)
{
	m_Lifetime = time;
}

function OnDestroy()
{
	transform.localScale = m_OrigScale;
	if(Network.isServer)
	{
	   //  gameObject.GetComponent(BeeScript).enabled = true;
		// var pos:Vector3 = GetComponent(BeeScript).FindRespawnLocation();
		// ServerRPC.Buffer(networkView,"Respawn", RPCMode.All,pos);
	}
	
}