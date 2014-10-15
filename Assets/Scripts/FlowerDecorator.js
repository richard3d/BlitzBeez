#pragma strict

private var m_Lifetime : float = 1.0;
private var m_LifeTimer : float = 0;
private var m_Flower : GameObject = null;
private var m_BeeAdditionTimer : float = 0.1;
private var m_FirstInput : boolean = true;
private var m_SwarmCreated : boolean = false;
var m_ShieldEffect : GameObject = null;
private var m_PollenParticles : GameObject = null;
 var m_ProgressEffect : GameObject = null;
var m_FlashTimer : float = -1;
function Start () {

	GetComponent(BeeControllerScript).m_MoveEnabled = false;
	var trgt : Transform = transform.Find("PowerShotParticleSystem(Clone)");
	if(trgt != null)
		Destroy(trgt.gameObject);
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
	
		//m_Flower.audio.Play();
		Camera.main.animation["CameraLessDramaticZoom"].speed = 1;
		Camera.main.animation.Play("CameraLessDramaticZoom");
	}
	
	//don't show progress meter if the flower is already completely occupied
	if(m_Flower.GetComponent(FlowerScript).m_NumBees < m_Flower.GetComponent(FlowerScript).m_MaxBees)
	{
		if(NetworkUtils.IsControlledGameObject(gameObject))
			m_Flower.audio.Play();
		m_ProgressEffect = GameObject.Instantiate(m_Flower.GetComponent(FlowerScript).m_ProgressEffectInstance);
		m_ProgressEffect.transform.position = m_Flower.transform.position + Vector3.up * 6;
		m_ProgressEffect.transform.localScale = Vector3(25,0,25);
		m_ProgressEffect.renderer.material.SetColor("_Emission", renderer.material.color);
	}
	//m_ProgressEffect.transform.eulerAngles.y = transform.eulerAngles.y;
	
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

	if(Network.isServer && GetComponent(BeeScript).m_WorkerBees == 0)
	{
		ServerRPC.Buffer(networkView,"RemoveComponent", RPCMode.All, "FlowerDecorator");
		return;
	}

	if(!m_Flower)
		return;
		
	GetComponent(BeeControllerScript).m_WorkerGenTimer = 	GetComponent(BeeControllerScript).m_WorkerGenTime;
	var flowerComp:FlowerScript = m_Flower.GetComponent(FlowerScript);	
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		var txt:GameObject= gameObject.Find("SwarmCountText");
		txt.transform.position = Camera.main.WorldToViewportPoint(m_Flower.transform.position - Vector3.up * transform.localScale.z*18);
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
				ServerRPC.Buffer(networkView,"AddSwarm", RPCMode.All, m_Flower.name, offset, 10);
				
			}
			
			
			if(flowerComp.m_NumBees >= flowerComp.m_MaxBees)
			{
				
				ServerRPC.Buffer(networkView,"RemoveComponent", RPCMode.All, "FlowerDecorator");
				return;
			}
			else
			{
				if(GetComponent(BeeScript).m_WorkerBees > 0)
				{
					offset  = Vector3(0,200,0);
					ServerRPC.Buffer(networkView,"AddWorkerBee", RPCMode.All,m_Flower.name, offset);
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
	
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		if(m_Flower.transform.Find("Swarm"+m_Flower.name) == null)
		{
			// txt= gameObject.Find("SwarmCountText");
			// txt.transform.position = Camera.main.WorldToViewportPoint(transform.position + Vector3.up * transform.localScale.z*5);
			// txt.transform.position.y += 0.04;
			// //txt.GetComponent(GUIText).enabled = true;
			// //txt.GetComponent(GUIText).text = "Capturing";
			// txt.GetComponent(GUIText).fontSize = 24;
		}
	}

}

//sets the lifetime back to zero
function Reset()
{
	m_LifeTimer = 0;
}

function OnGUI()
{
	if(m_Flower == null)
		return;
	
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		var width : float = 100;
		var perc : float =   Mathf.Min(m_LifeTimer/m_Lifetime,1) * width;	
		var pos : Vector3 = Camera.main.WorldToScreenPoint(m_Flower.transform.position + Vector3.up * transform.localScale.z*6);
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
			GUI.DrawTexture(Rect(pos.x - 50 + i*32,Screen.height-pos.y +100, beeSize, beeSize), GetComponent(BeeScript).BeeTexture);
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
	if(m_Flower.transform.Find("Swarm"+m_Flower.name) == null)
	{
		
		gameObject.Destroy(m_ShieldEffect);
		if(NetworkUtils.IsControlledGameObject(gameObject))
		{
			Camera.main.animation["CameraLessDramaticZoom"].time = Camera.main.animation["CameraDramaticZoom"].length;
			Camera.main.animation["CameraLessDramaticZoom"].speed = -1;
			Camera.main.animation.Play("CameraLessDramaticZoom");
		}
		
		if(Network.isServer)
			ServerRPC.DeleteFromBuffer(m_Flower);
		
	}
	else
	{
		if(gameObject.Find(m_Flower.name+"/Shield") == null)
		{
			m_ShieldEffect = GameObject.Instantiate(Resources.Load("GameObjects/Shield"));
			m_ShieldEffect.name = "Shield";
			m_ShieldEffect.transform.position = m_Flower.transform.position;
			m_ShieldEffect.transform.parent = m_Flower.transform;
			m_ShieldEffect.GetComponent(ParticleSystem).renderer.material.SetColor("_EmisColor", renderer.material.color);
		}
		// m_ShieldEffect.GetComponent(ParticleSystem).startColor = gameObject.renderer.material.color;
		// // m_PollenParticles = gameObject.Instantiate(Resources.Load("GameObjects/PollenParticles"));
		// // m_PollenParticles.transform.position = m_Flower.transform.position;
		// // m_PollenParticles.name = "PollenParticles";
		// // m_PollenParticles.transform.parent = m_Flower.transform;
		// m_Flower.GetComponent(PollenNetworkScript).m_Owner = gameObject;
		
		// m_Flower.animation.Play("Flower");
		// AudioSource.PlayClipAtPoint(m_Flower.GetComponent(FlowerScript).m_BuildComplete, transform.position);
		if(NetworkUtils.IsControlledGameObject(gameObject))
		{	
			//AudioSource.PlayClipAtPoint(m_Flower.GetComponent(FlowerScript).m_StopwatchDing, transform.position);
			// var txt : GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/KudosText"));
			// txt.GetComponent(KudosTextScript).m_WorldPos = transform.position;
			// txt.GetComponent(UpdateScript).m_Lifetime = 2;
			// gameObject.GetComponent(BeeScript).m_Money +=  25;
			// txt.GetComponent(GUIText).text = "+ $25";
			// txt.GetComponent(GUIText).material.color = Color.yellow;
			Camera.main.GetComponent(CameraScript).Shake(0.25, 0.5);
			Camera.main.animation["CameraLessDramaticZoom"].time = Camera.main.animation["CameraDramaticZoom"].length;
			Camera.main.animation["CameraLessDramaticZoom"].speed = -1;
			Camera.main.animation.Play("CameraLessDramaticZoom");
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
	if(m_Flower.transform.Find("Shield") == null)
	{
		// m_ShieldEffect = GameObject.Instantiate(Resources.Load("GameObjects/Shield"));
		// m_ShieldEffect.name = "Shield";
		// m_ShieldEffect.transform.position = m_Flower.transform.position;
		// m_ShieldEffect.transform.parent = m_Flower.transform;
		
		// var parts : ParticleSystem.Particle[] = new ParticleSystem.Particle[m_ShieldEffect.GetComponent(ParticleSystem).particleCount];
		// var numParts : int = m_ShieldEffect.GetComponent(ParticleSystem).GetParticles(parts);
		// //Debug.Log("particle" + parts.length);
		// for(var i : int = 0; i < numParts; i++)
		// {
			// parts[i].color = gameObject.renderer.material.color;
		// }
		// m_ShieldEffect.GetComponent(ParticleSystem).SetParticles(parts, i);
		// m_ShieldEffect.GetComponent(ParticleSystem).startColor = gameObject.renderer.material.color;
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