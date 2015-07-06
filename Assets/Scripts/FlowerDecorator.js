#pragma strict

private var m_Lifetime : float = 3.0;
private var m_LifeTimer : float = 0;
private var m_Flower : GameObject = null;
private var m_BeeAdditionTimer : float = 0.1;
private var m_FirstInput : boolean = true;
private var m_NumWorkersAdded:int = 0;
var m_SwarmCreated : boolean = false;
var m_ShieldEffect : GameObject = null;
var m_FlowerShieldEffect : GameObject = null;
private var m_PollenParticles : GameObject = null;
var m_ProgressEffect : GameObject = null;
var m_FlashTimer : float = -1;
private var m_Camera:GameObject = null;
function Start () {

	m_Camera = GetComponent(BeeScript).m_Camera;
	GetComponent(BeeControllerScript).m_MoveEnabled = false;
	transform.GetChild(0).localEulerAngles.z = 0;
	var trgt : Transform = transform.Find("PowerShotParticleSystem(Clone)");
	if(trgt != null)
		Destroy(trgt.gameObject);
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
	
		//m_Flower.audio.Play();
		m_Camera.animation["CameraLessDramaticZoom"].speed = 1;
		m_Camera.animation.Play("CameraLessDramaticZoom");
	}
	
	//don't show progress meter if the flower is already completely occupied
	if(m_Flower.GetComponent(FlowerScript).m_NumBees < m_Flower.GetComponent(FlowerScript).m_MaxBees)
	{
		if(NetworkUtils.IsLocalGameObject(gameObject))
			m_Flower.audio.Play();
		m_ProgressEffect = GameObject.Instantiate(m_Flower.GetComponent(FlowerScript).m_ProgressEffectInstance);
		m_ProgressEffect.transform.position = m_Flower.transform.position + Vector3.up * 6;
		m_ProgressEffect.transform.localScale = Vector3(25,0,25);
		m_ProgressEffect.renderer.material.SetColor("_Emission", NetworkUtils.GetColor(gameObject)*0.5);
	}

	var color = NetworkUtils.GetColor(gameObject);
	m_FlowerShieldEffect = GameObject.Instantiate(Resources.Load("GameObjects/FlowerShield"),m_Flower.transform.position + Vector3.up * 16,Quaternion.identity);
	m_FlowerShieldEffect.name = "FlowerShield";
	m_FlowerShieldEffect.transform.localEulerAngles = Vector3(0,180,0);
	m_FlowerShieldEffect.animation.Play();
	m_FlowerShieldEffect.GetComponent(FlowerShieldScript).m_Owner = gameObject;

}

function SetLifetime(life:float)
{
	m_Lifetime = life;	
}

function OnNetworkInput(IN : InputState)
{
	
	if(!networkView.isMine)
	{
		return;
	}
	
	if(m_FirstInput)
	{
		 m_FirstInput = false;
		return;
	}
	
	if(m_Flower == null)
		return;
		
	
	
	if(!IN.GetAction(IN.USE))
	{
		ServerRPC.Buffer(networkView,"RemoveComponent", RPCMode.All, "FlowerDecorator");
	}
	
	
}

function Update () {


	GetComponent(UpdateScript).m_Vel = Vector3.zero;
	GetComponent(UpdateScript).m_Accel = Vector3.zero;
	if(Network.isServer && GetComponent(BeeScript).m_WorkerBees == 0)
	{
		//ServerRPC.Buffer(networkView,"RemoveComponent", RPCMode.All, "FlowerDecorator");
		transform.position +=   (m_Flower.transform.position + Vector3(0,12,0) - transform.position) * Time.deltaTime * 20;
		transform.position. y = m_Flower.transform.position.y + 12;
		if(!GetComponent(BeeControllerScript).m_LookEnabled)
			transform.eulerAngles = Vector3(0,0,0);
			
		if(m_ProgressEffect != null)
			m_ProgressEffect.renderer.material.SetFloat("_Cutoff", 1.0);
		return;
	}

	if(!m_Flower)
		return;
		
	if(m_FlowerShieldEffect != null)
	{
		m_FlowerShieldEffect.transform.rotation = transform.rotation;
	//	m_FlowerShieldEffect.transform.localEulerAngles.y += 180;
	}
		
	//GetComponent(BeeControllerScript).m_WorkerGenTimer = 	GetComponent(BeeControllerScript).m_WorkerGenTime;
	var flowerComp:FlowerScript = m_Flower.GetComponent(FlowerScript);	
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		var txt:GameObject= gameObject.Find("SwarmCountText");
		txt.transform.position = m_Camera.camera.WorldToViewportPoint(m_Flower.transform.position - Vector3.up * transform.localScale.z*18);
		txt.transform.position.y += 0.04;
		txt.GetComponent(GUIText).enabled = true;
		if(flowerComp.m_NumBees >= flowerComp.m_MaxBees)
		{
			txt.GetComponent(GUIText).material.color = Color.white;
			txt.GetComponent(GUIText).text = "MAX";
		}
		else
			txt.GetComponent(GUIText).enabled = false;
	}
	
	if(m_LifeTimer < m_Lifetime)	
	{
		m_LifeTimer += Time.deltaTime;
		
		if(m_ProgressEffect != null)
			m_ProgressEffect.renderer.material.SetFloat("_Cutoff", 1.01-Mathf.Min(m_LifeTimer/m_Lifetime,1));
		//m_ProgressEffect.transform.eulerAngles.y = transform.eulerAngles.y+180;
	}
	else
	{
		var Comp : BeeParticleScript = GetComponentInChildren(BeeParticleScript) as BeeParticleScript;
		if(Comp == null)
			return;
		
		
		if(Network.isServer)
		{
			
			if(flowerComp.m_NumBees == 0 && m_Flower.transform.Find("Swarm"+m_Flower.name) == null)
			{
				//add swarm and shield and bee
				var offset : Vector3 = Vector3(0,12,0);
				m_SwarmCreated = true;
				flowerComp.m_PollinationTimer = flowerComp.m_PollinationTime;
				//ServerRPC.Buffer(networkView,"AddSwarm", RPCMode.All, m_Flower.name, offset, 10);
				
			}
			
			
			if(flowerComp.m_NumBees >= flowerComp.m_MaxBees)
			{
				
				//ServerRPC.Buffer(networkView,"RemoveComponent", RPCMode.All, "FlowerDecorator");
				//return;
			}
			else
			{
				if(GetComponent(BeeScript).m_WorkerBees > 0)
				{
					offset  = Vector3(0,200,0);
					ServerRPC.Buffer(networkView,"AddWorkerBee", RPCMode.All,m_Flower.name, offset);
					m_NumWorkersAdded++;
					if(Network.isServer)
					{
						//Since the rock is destroying there is no reason to keep its messages in the buffer up to this point
						//hence we clear them out
						
						var InstType : GameObject = GameObject.Instantiate(Resources.Load("GameObjects/Coin"));
						if(InstType != null)
						{
							var count : int = m_NumWorkersAdded * 3;
							for(var i : int = 0; i < count; i++)
							{
								var Quat = Quaternion.AngleAxis(360.0/count * i, Vector3.up);
								var vel =  Quat*Vector3(0,0,1) ;//: Vector2 = Random.insideUnitCircle.normalized*50;
								var viewID : NetworkViewID= Network.AllocateViewID();
								var go1 : GameObject = GameObject.Find("GameServer").GetComponent(ServerScript).NetworkInstantiate("Coin","", transform.position + Vector3.up *transform.localScale.magnitude*4, Quaternion.identity, viewID ,  0);
								go1.GetComponent(UpdateScript).m_Vel = vel.normalized * Random.Range(20, 50);
								//go1.GetComponent(UpdateScript).m_Vel.z = vel.y;
								go1.GetComponent(UpdateScript).m_Vel.y = Random.Range(20, 100);
								ServerRPC.Buffer(GameObject.Find("GameServer").GetComponent(ServerScript).m_GameplayMsgsView, "NetworkInstantiate", RPCMode.Others, "Coin",go1.name, transform.position + Vector3.up *transform.localScale.magnitude*4, Quaternion.identity, viewID, 0);
								go1.GetComponent(UpdateScript).MakeNetLive(); 	
							}
						}
					}
				}
			}
		}
	}
	
	//m_BeeAdditionTimer -= Time.deltaTime;	
		
	//m_Flower.GetComponent(FlowerScript).m_LifebarTimer = 0.01;
	transform.position +=   (m_Flower.transform.position + Vector3(0,12,0) - transform.position) * Time.deltaTime * 20;
	transform.position. y = m_Flower.transform.position.y + 12;
	if(!GetComponent(BeeControllerScript).m_LookEnabled)
		transform.eulerAngles = Vector3(0,0,0);


}

//sets the lifetime back to zero
function Reset()
{
	m_LifeTimer = 0;
}

function OnGUI()
{
	var flowerComp:FlowerScript = m_Flower.GetComponent(FlowerScript);
	if(m_Flower == null || GetComponent(BeeScript).m_WorkerBees == 0)
		return;
	
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		var width : float = 100;
		var perc : float =   Mathf.Min(m_LifeTimer/m_Lifetime,1) * width;	
		var pos : Vector3 = m_Camera.camera.WorldToScreenPoint(m_Flower.transform.position + Vector3.up * transform.localScale.z*6);
		//GUI.DrawTexture(Rect(pos.x - width* 0.5,Screen.height-pos.y, width, 10), m_Flower.GetComponent(FlowerScript).BaseTexture);
	//	GUI.DrawTexture(Rect(pos.x- width* 0.5,Screen.height-pos.y,perc,10), m_Flower.GetComponent(FlowerScript).LifeTexture);
		
		width  = 32;
		// GUIUtility.RotateAroundPivot ((m_LifeTimer/m_Lifetime)*1*359,  Vector2(pos.x, Screen.height-pos.y)); 
		// GUI.DrawTexture(Rect(pos.x - 64* 0.5,Screen.height-pos.y - 64/2, 64, 64), m_Flower.GetComponent(FlowerScript).BaseTexture);
		// GUIUtility.RotateAroundPivot (-(m_LifeTimer/m_Lifetime)*1*359,  Vector2(pos.x, Screen.height-pos.y)); 
		
		
		
		GUI.DrawTexture(Rect(pos.x - 100,Screen.height-pos.y +100, 200, 55), m_Flower.GetComponent(FlowerScript).m_DroneAssignmentTexture);
		var beeSize:float = 24+Mathf.Sin(Time.time*16)*2;
		for(var i:int = 0; i < m_Flower.GetComponent(FlowerScript).m_NumBees; i++)
		{
			GUI.color = NetworkUtils.GetColor(gameObject);
			GUI.DrawTexture(Rect(pos.x - 50 + i*32,Screen.height-pos.y +100, beeSize, beeSize), GetComponent(BeeScript).BeeTexture);
			GUI.color = Color.white;
			GUI.DrawTexture(Rect(pos.x - 50 + i*32,Screen.height-pos.y +100, beeSize, beeSize), GetComponent(BeeScript).BeeWingsTexture);
		}
		//GUIUtility.RotateAroundPivot (Mathf.Min(m_LifeTimer/m_Lifetime,1)*359,  Vector2(pos.x, Screen.height-pos.y)); 
		
		if(m_FlashTimer > 0)
		{
			m_FlashTimer -= Time.deltaTime;
			var origClr = GUI.color; 
			GUI.color = Color(1,1,1, m_FlashTimer);
			GUI.DrawTexture(Rect(pos.x - 100,Screen.height-pos.y +100, 200, 55), m_Flower.GetComponent(FlowerScript).m_AssignmentFlasherTexture);
			//GUI.DrawTexture(Rect(pos.x - 100,Screen.height-pos.y +100, 200, 55), m_Flower.GetComponent(FlowerScript).ClockTexture);
			GUI.color = origClr;
		}
		//GUI.DrawTexture(Rect(pos.x - width* 0.5,Screen.height-pos.y- width/2, width, width), m_Flower.GetComponent(FlowerScript).ClockHandTexture);
	}
}


function OnDestroy()
{
	m_Flower.audio.Stop();
	m_Flower.collider.enabled = true;
	Destroy(m_FlowerShieldEffect);
	m_Flower.GetComponent(FlowerScript).m_Occupied = false;
	
	if(m_Flower.GetComponent(FlowerScript).m_ShieldEffect != null)
	{
		m_Flower.GetComponent(FlowerScript).m_ShieldEffect.renderer.enabled = true;
		m_Flower.GetComponent(FlowerScript).m_ShieldEffect.transform.Find("ShieldSphere").renderer.enabled = true;
		m_Flower.GetComponent(FlowerScript).m_ShieldEffect.transform.Find("ShieldSphere").animation.Stop();
		m_Flower.GetComponent(FlowerScript).m_ShieldEffect.transform.Find("ShieldSphere").animation.Play("FlowerShield");
	}
	
	if(!m_SwarmCreated)
	{
		
		gameObject.Destroy(m_ShieldEffect);
		if(NetworkUtils.IsLocalGameObject(gameObject))
		{
			m_Camera.animation["CameraLessDramaticZoom"].time = m_Camera.animation["CameraDramaticZoom"].length;
			m_Camera.animation["CameraLessDramaticZoom"].speed = -1;
			m_Camera.animation.Play("CameraLessDramaticZoom");
		}
		
		if(Network.isServer)
			ServerRPC.DeleteFromBuffer(m_Flower);
		
	}
	else
	{
		m_Flower.GetComponent(FlowerScript).m_Owner = gameObject;
		if(m_Flower.GetComponent(FlowerScript).m_ShieldEffect == null)
		{
			var color = NetworkUtils.GetColor(gameObject);	
			var shield:GameObject = GameObject.Instantiate(Resources.Load("GameObjects/Shield"));
		
			shield.name = "Shield";
			shield.transform.position = m_Flower.transform.position;
			color.a  = 0.5;
			shield.renderer.material.SetColor("_TintColor", color);
			color*=0.5;
			color.a = 0.392*0.5;
			shield.transform.Find("ShieldSphere").renderer.material.SetColor("_TintColor", color);
			m_Flower.GetComponent(FlowerScript).m_ShieldEffect = shield;
			m_Flower.GetComponent(FlowerScript).m_ShieldEffect.transform.Find("ShieldSphere").animation.Play("FlowerShield");
			//m_ShieldEffect.transform.parent = m_Flower.transform;
			
			
			// m_ShieldEffect = GameObject.Instantiate(Resources.Load("GameObjects/CircularLightBeam"));
			// m_ShieldEffect.name = "Shield";
			// m_ShieldEffect.transform.position = m_Flower.transform.position;
			// m_ShieldEffect.transform.parent = m_Flower.transform;
			
			// var LightspotEffect:GameObject= GameObject.Instantiate(Resources.Load("GameObjects/LightSpot"));
			// LightspotEffect.name = "LightSpot";
			// LightspotEffect.transform.position = m_Flower.transform.position + Vector3.up*0.1;
			// LightspotEffect.transform.parent = m_Flower.transform;
			// LightspotEffect.transform.localScale = Vector3(1.3,1.3,0.0001);
			// LightspotEffect.renderer.material.SetColor("_TintColor", color);
		}
		
		
		
		if(NetworkUtils.IsLocalGameObject(gameObject))
		{	
			//AudioSource.PlayClipAtPoint(m_Flower.GetComponent(FlowerScript).m_StopwatchDing, transform.position);
			// var txt : GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/KudosText"));
			// txt.GetComponent(KudosTextScript).m_WorldPos = transform.position;
			// txt.GetComponent(UpdateScript).m_Lifetime = 2;
			// gameObject.GetComponent(BeeScript).m_Money +=  25;
			// txt.GetComponent(GUIText).text = "+ $25";
			// txt.GetComponent(GUIText).material.color = Color.yellow;
			
			m_Camera.animation["CameraLessDramaticZoom"].time = m_Camera.animation["CameraDramaticZoom"].length;
			m_Camera.animation["CameraLessDramaticZoom"].speed = -1;
			m_Camera.animation.Play("CameraLessDramaticZoom");
		}
	}
	Destroy(m_ProgressEffect);
	gameObject.Find("SwarmCountText").GetComponent(GUIText).enabled = false;
	GetComponent(BeeControllerScript).m_MoveEnabled = true;
	GetComponent(BeeControllerScript).m_LookEnabled = true;
	GetComponent(BeeControllerScript).m_AttackEnabled = true;
	GetComponent(BeeControllerScript).SetShootButtonTimeHeld(0);
	
	
	// var poof:GameObject = GameObject.Instantiate(Resources.Load("GameObjects/PowerShotParticleSystem"));
	// poof.transform.position = transform.position ;
	
	//if(Network.isServer && m_SwarmCreated)
		//gameObject.networkView.RPC("AddXP", RPCMode.All, 999);
}

function SetFlower(flower : GameObject)
{
	m_Flower = flower;
	
	m_Flower.collider.enabled = false;
	if(m_Flower.GetComponent(FlowerScript).m_ShieldEffect != null)
	{
		m_Flower.GetComponent(FlowerScript).m_ShieldEffect.renderer.enabled = false;
		m_Flower.GetComponent(FlowerScript).m_ShieldEffect.transform.Find("ShieldSphere").renderer.enabled = false;
	}
	
}

function GetFlower() : GameObject
{
	return m_Flower;
}

// @RPC function RemoveFlowerDecorator()
// {
	// if(m_Flower.transform.Find("Swarm"+m_Flower.name) == null)
	// {
		// gameObject.Destroy(m_ShieldEffect);
		// if(Network.isServer)
			// ServerRPC.DeleteFromBuffer(m_Flower);
	// }
	// else
	// {
		// Camera.main.GetComponent(CameraScript).Shake(0.5, 0.25);
	// }
	// Destroy(this);
// }