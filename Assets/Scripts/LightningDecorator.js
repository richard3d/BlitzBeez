#pragma strict
private var m_Lifetime : float = 0.0;
private var m_AnimTime : float = 0.25;
private var m_StrikePos = Vector3(0,350,0);
private var m_LightningEffect : GameObject = null;
private var m_ImpactEffect : GameObject = null;
function Awake()
{
	gameObject.AddComponent(ControlDisablerDecorator);
	

	collider.enabled = false;
	//transform.position = m_StrikePos;
	GetComponentInChildren(ParticleRenderer).enabled = false;
	GetComponent(TrailRenderer).enabled = true;
	m_LightningEffect = gameObject.Find(gameObject.name+"/Lightning(Clone)");
	
}

function Start () {

	var gos:GameObject[] = gameObject.FindGameObjectsWithTag("Player");
	var playerToHit:GameObject = null;
	var closestDist : float = 9999;
	for(var go:GameObject in gos)
	{	
		//check on the server if the initiating player is visible (since camera is not necassarily on that player)
		if(go != gameObject)
		{
			var dist:float = (go.transform.position - transform.position).magnitude;
			var width:float =GetComponent(BeeScript).m_Camera.camera.orthographicSize*2*Mathf.Cos(45*Mathf.Deg2Rad);
			
			var pos:Vector2 = new Vector2(go.transform.position.x, go.transform.position.z);
			
			//Debug.Log("container: "+ camRect.Contains(pos, true));
		
			if(dist < closestDist && 
			  pos.x > transform.position.x - width &&
			  pos.x < transform.position.x + width && 
			  pos.y > transform.position.z - width && 
			  pos.y < transform.position.z + width)
			{
				closestDist  = dist;
				playerToHit = go;
			}
		}
	}
	
	if(playerToHit != null)
		{Debug.Log("Notnull");
			m_StrikePos = playerToHit.transform.position;
			}
	else
	{Debug.Log(gameObject.name+" null");
		m_StrikePos = transform.position;
		}
	m_StrikePos.y = 350;
	
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		GetComponent(BeeScript).m_Camera.GetComponent(CameraScript).m_Pitch = 45;
		GetComponent(BeeScript).m_Camera.AddComponent(CameraZoomDecorator);
		GetComponent(BeeScript).m_Camera.GetComponent(CameraZoomDecorator).m_fLifetime = m_Lifetime+m_AnimTime-0.1;
		GetComponent(BeeScript).m_Camera.GetComponent(CameraZoomDecorator).m_ZoomFOV = 70;
	}
}

function Update () {
	
	GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
	GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
	if(m_Lifetime > 0.0)
	{
		m_Lifetime -= Time.deltaTime;
		transform.position = Vector3(transform.position.x, Mathf.Lerp(5, m_StrikePos.y, 1-m_Lifetime/0.25), transform.position.z);
		if(m_Lifetime <= 0.0)
		{		
			//find respawn position;
			//start animating

			m_LightningEffect.AddComponent(TrailRenderer);
			var Trail:TrailRenderer = m_LightningEffect.GetComponent(TrailRenderer);
			Trail.startWidth = 0;
			Trail.endWidth = 50;
			Trail.time = 0.3;
			Trail.material.shader = Shader.Find("Particles/Additive");
			Trail.material.color= Color.yellow;
		}
	}
	
	if(m_Lifetime <= 0)
	{
		gameObject.GetComponent(BeeScript).enabled = false;
		transform.position = Vector3(m_StrikePos.x, Mathf.Lerp(m_StrikePos.y, 7, 1-m_AnimTime/0.25), m_StrikePos.z);
		m_LightningEffect.transform.position = transform.position+Vector3(Random.Range(-30, 30),0,0);
		m_AnimTime -= Time.deltaTime;
		if(m_AnimTime <= 0)
		{
			m_LightningEffect.transform.position = transform.position;
			if(Network.isServer)
				networkView.RPC("DestroyLightningDecorator",RPCMode.All);
		}
		
	}
}

function SetLifetime(time : float)
{
	m_Lifetime = time;
}

@RPC function DestroyLightningDecorator()
{
	Destroy(this);
	
}

function OnDestroy()
{
	collider.enabled = true;
	//gameObject.animation.Play("SpawnPlayer");
	Destroy(GetComponent(ControlDisablerDecorator));
	GetComponent(BeeScript).enabled = true;
	GetComponent(TrailRenderer).enabled = false;
	GetComponentInChildren(ParticleRenderer).enabled = true;
	Destroy(m_LightningEffect);
	
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		GetComponent(BeeScript).m_Camera.GetComponent(CameraScript).m_Pitch = GetComponent(BeeScript).m_Camera.GetComponent(CameraScript).m_DefaultPitch;
		var cam:GameObject = GetComponent(BeeScript).m_Camera;
		//cam.GetComponent(CameraScript).Shake(0.33,3.5);
		 cam.AddComponent(CameraZoomDecorator);
		 cam.GetComponent(CameraZoomDecorator).m_fLifetime = 0.25;
		 cam.GetComponent(CameraZoomDecorator).m_ZoomFOV = 45;
	}
	// if(Network.isServer)
	// {
		// //NetworkDestroy(m_LightningEffect);
		// var server : ServerScript = GameObject.Find("GameServer").GetComponent(ServerScript);
		// //this object is never network instantiated and all other server calls happen via other methods
		// server.m_GameplayMsgsView.RPC( "NetworkDestroy", RPCMode.All, m_LightningEffect.name);
	// }
}