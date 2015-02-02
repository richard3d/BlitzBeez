#pragma strict
var m_Radius : float = 100;
var m_HitTimer : float = 0;
var m_Diff:Vector3;
var m_AttackEffect:GameObject = null;
var m_SmokeTrailEffect:GameObject = null;
var m_RageTimer :float = 0;
var m_RespawnTimer:float = 0;
var m_RespawnTime:float = 10;
var m_BlastingOff:boolean = false;
private var m_HP = 6;
private var m_InitialPos : Vector3;
function Start () {

	m_InitialPos = transform.position;
	animation.Play("BearWalk");

}

function Update () {

	//GetComponent(NavMeshAgent).SetDestination(
	// rigidbody.velocity = Vector3(0,0,0);
	// var dist : float = 99999;
	// var target : GameObject = null;
	if(m_RageTimer > 0)
	{
		m_RageTimer -= Time.deltaTime;
		if(m_RageTimer <= 0)
		{
			transform.parent.GetComponent(NavMeshAgent).speed = 1;
			animation["BearWalk"].speed = 1;
		}
		
		if(renderer.isVisible)
		{
			Camera.main.GetComponent(CameraScript).Shake(0.1, 1);
		}
	}
	
	if(m_RespawnTimer > 0)
	{
		m_RespawnTimer -= Time.deltaTime;
		if(m_RespawnTimer <= 0)
		{
			if(Network.isServer)
				gameObject.networkView.RPC("Respawn", RPCMode.All);
		}
	}
	
	// if(Network.isServer && m_BlastingOff && transform.parent.position.y > 500)
	// {
		
		// //transform.parent.GetComponent(NavMeshAgent).updatePosition = false;
		// var speed:float = 1;
		// transform.parent.GetComponent(UpdateScript).m_MaxSpeed = 50;
		// transform.parent.GetComponent(UpdateScript).m_Vel = Vector3(0,0, 0);
		// transform.parent.GetComponent(UpdateScript).m_Accel = Vector3(0,0, 0);
		// transform.parent.GetComponent(UpdateScript).m_AngVel = Vector3(0,0,0);
		// transform.parent.rotation = Quaternion.identity;
		// transform.parent.position = (Vector3(-86,0.1, 251));
		// transform.parent.GetComponent(NavMeshAgent).enabled = true;
		
	// //	transform.parent.GetComponent(NavMeshAgent).velocity = Vector3.zero;
		// transform.parent.GetComponent(NavMeshAgent).ResetPath();
		
		// //animation.Play();
		// Destroy(GetComponent(FlasherDecorator));
		// Destroy(transform.GetChild(0).gameObject);
		// //transform.parent.gameObject.AddComponent(PauseDecorator);
		// //transform.parent.GetComponent(PauseDecorator).m_MaxSpeed = 0;
		// //transform.parent.GetComponent(PauseDecorator).m_Lifetime = 0.15;
		// //transform.parent.position = transform.parent.GetComponent(NavMeshAgent).nextPosition;
		// m_BlastingOff = false;
		// m_RageTimer = 0;
		// return;
	// }
	
	
	 for(var bee : GameObject in gameObject.FindGameObjectsWithTag("Player"))
	 {
		if(Network.isServer && transform.parent.GetComponent(NavMeshAgent).enabled)
		{
			transform.parent.GetComponent(NavMeshAgent).SetDestination(bee.transform.position);
			transform.parent.GetComponent(NavMeshAgent).updatePosition = false;
			transform.parent.GetComponent(UpdateScript).m_Vel = transform.parent.GetComponent(NavMeshAgent).velocity;
			transform.parent.GetComponent(UpdateScript).m_Vel.y = 0;
		}
		var norm:Vector3 = bee.transform.position - transform.position;
		var dist = norm.magnitude;
		norm.Normalize();
		if(dist < 35 && bee.GetComponent(RespawnDecorator) == null && m_RespawnTimer <= 0)
		{
			if(!animation.IsPlaying("BearAttack"))
				animation.Play("BearAttack");
			if(GetComponent(FlasherDecorator) == null)
			{
				// gameObject.AddComponent(FlasherDecorator);
				// GetComponent(FlasherDecorator).m_Color = Color.red;
				// GetComponent(FlasherDecorator).m_FlashDuration = 0.1;
				// GetComponent(FlasherDecorator).m_NumberOfFlashes = 1;
			}
		}	
		else if(!animation.IsPlaying("BearAttack"))
		{
			if(!animation.IsPlaying("BearWalk"))
				animation.Play("BearWalk");
		}		
		// var diff : Vector3 = bee.transform.position - transform.parent.position;
		// if(diff.magnitude < dist )
		// {
			// dist = diff.magnitude;
			// target = bee;
		// }
	 }
	
	// if(true)
	// {
		// m_Diff = target.transform.position - transform.position;
		// m_Diff.y = 0;
		// //GetComponent(UpdateScript).m_Vel += diff * Time.deltaTime;
	// }
	// else
	// {
		// m_Diff = m_InitialPos - transform.position;
		// m_Diff.y = 0;
		// GetComponent(UpdateScript).m_Vel += m_Diff * Time.deltaTime;	
	// }
	
	// // transform.eulerAngles.z = Mathf.Sin(Time.time * 6) * 15;
	// // transform.position.y = 0;

}


function Step()
{
		transform.parent.position +=transform.parent.forward*5;
}

@RPC function Respawn()
{
	transform.parent.GetComponent(UpdateScript).m_MaxSpeed = 50;
	transform.parent.GetComponent(UpdateScript).m_Vel = Vector3(0,0, 0);
	transform.parent.GetComponent(UpdateScript).m_Accel = Vector3(0,0, 0);
	transform.parent.GetComponent(UpdateScript).m_AngVel = Vector3(0,0,0);
	transform.parent.rotation = Quaternion.identity;
	if(Network.isServer)
	{
		
		transform.parent.position = (Vector3(-86,0.1, 251));
		transform.parent.GetComponent(NavMeshAgent).enabled = true;
		transform.parent.GetComponent(NavMeshAgent).ResetPath();
	}
	animation.Play("BearWalk");
	Destroy(GetComponent(FlasherDecorator));
	Destroy(transform.GetChild(0).gameObject);	
}

function OnBulletCollision(coll:BulletCollision)
{
	if(Network.isServer)
	{		
		
		if(coll.bullet.GetComponent(BulletScript).m_PowerShot)
		{
			m_HP -= 6;
			if(m_RageTimer > 0)
			{
		
				gameObject.networkView.RPC("BlastOff", RPCMode.All);
			}
		}
		else
		{
			m_HP -= 1;
		}
		
		if(GetComponent(MovementDecorator) == null)
		{
			gameObject.AddComponent(MovementDecorator);
			GetComponent(MovementDecorator).m_MaxSpeed = 0;
			GetComponent(MovementDecorator).m_Lifetime = 0.15;
		}
		gameObject.networkView.RPC("onBulletHit", RPCMode.All,m_HP);
		
		return;
	}
}

@RPC function onBulletHit(currHP:int)
{
	//gameObject.animation.Play("BearHit");
	if(currHP <= 0)
	{
		m_HP = currHP;
		if(m_RageTimer <= 0 && m_RespawnTimer <= 0)
		{
			m_RageTimer = 10;
			if(GetComponent(FlasherDecorator) == null)
			{
				gameObject.AddComponent(FlasherDecorator);
				GetComponent(FlasherDecorator).m_Color = Color.red;
				GetComponent(FlasherDecorator).m_FlashDuration = 0.1;
				GetComponent(FlasherDecorator).m_NumberOfFlashes = 100;
			}
			transform.parent.GetComponent(NavMeshAgent).speed = 35;
			animation["BearWalk"].speed = 4;
		}
	}
		
	if(GetComponent(FlasherDecorator) == null)
	{
		gameObject.AddComponent(FlasherDecorator);
		GetComponent(FlasherDecorator).m_Color = Color.red;
		GetComponent(FlasherDecorator).m_FlashDuration = 0.1;
		GetComponent(FlasherDecorator).m_NumberOfFlashes = 1;
	}
	
}

function OnCollisionEnter(coll:Collision)
{
	if(Network.isServer)
	{
		if(coll.gameObject.tag == "Explosion")
		{
			gameObject.networkView.RPC("BlastOff", RPCMode.All);
		}
		else
		if(coll.gameObject.tag == "Hammer")
		{
			gameObject.networkView.RPC("BlastOff", RPCMode.All);
		}
	}
}

@RPC function BlastOff()
{
	transform.parent.GetComponent(NavMeshAgent).speed = 1;
	transform.parent.GetComponent(NavMeshAgent).enabled = false;
	//transform.parent.GetComponent(NavMeshAgent).updatePosition = false;
	var speed:float = 300;
	transform.parent.GetComponent(UpdateScript).m_MaxSpeed = speed;
	transform.parent.GetComponent(UpdateScript).m_Vel = Vector3.up * speed+Vector3.right * speed;//transform.parent.GetComponent(NavMeshAgent).velocity;
	transform.parent.GetComponent(UpdateScript).m_Accel = Vector3(0,-3000, 0);
	transform.parent.GetComponent(UpdateScript).m_AngVel = Vector3(0,0,speed*5);
	animation["BearWalk"].speed = 1;
	animation.Stop("BearWalk");
	//transform.parent.gameObject.AddComponent(PauseDecorator);
	//transform.parent.GetComponent(PauseDecorator).m_MaxSpeed = 0;
	//transform.parent.GetComponent(PauseDecorator).m_Lifetime = 0.15;
	m_RespawnTimer = m_RespawnTime;
	
	
	var smoke:GameObject = GameObject.Instantiate(m_SmokeTrailEffect, transform.position, Quaternion.identity);
	smoke.transform.parent = transform;
	
	
	if(Network.isServer)
	{
		var count : int =1;
			
		//perform a damage roll to see how many coins we should spawn
		var sum : int = Dice.RollDice(2,6);
		
		if(sum <= 3 || sum > 8)
		{
			count = 10;
		}
		else if(sum == 5 || sum == 4)
		{
			count = 5;
		}
		else if(sum == 6 || sum == 8)
		{
			count = 3;
		}
		
		
		
		for(var i : int = 0; i < count; i++)
		{
			var Quat = Quaternion.AngleAxis(360.0/count * i, Vector3.up);
			var vel =  Quat*Vector3(0,0,1) ;//: Vector2 = Random.insideUnitCircle.normalized*50;
			var viewID : NetworkViewID= Network.AllocateViewID();
			var go1 : GameObject = GameObject.Find("GameServer").GetComponent(ServerScript).NetworkInstantiate("Coin","", transform.position + Vector3(0,18,0), Quaternion.identity, viewID ,  0);
			go1.GetComponent(UpdateScript).m_Vel = vel.normalized * Random.Range(20, 50);
			//go1.GetComponent(UpdateScript).m_Vel.z = vel.y;
			go1.GetComponent(UpdateScript).m_Vel.y = Random.Range(20, 100);
			ServerRPC.Buffer(GameObject.Find("GameServer").GetComponent(ServerScript).m_GameplayMsgsView, "NetworkInstantiate", RPCMode.Others, "Coin",go1.name, transform.position+ Vector3(0,18,0), Quaternion.identity, viewID, 0);
			go1.GetComponent(UpdateScript).MakeNetLive(); 	
		}
	}
}



// function OnCollisionEnter(coll : Collision) {

	// //if we hit a bee we should move him
	// if(Network.isServer)
	// {
		// if(coll.gameObject.tag == "Player")
		// {
			// var vDiff : Vector3 = coll.gameObject.transform.position - transform.position;
			// vDiff.y = 0;
		
			// coll.gameObject.GetComponent(UpdateScript).m_Vel = vDiff * 250;
			// coll.gameObject.GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
			// //coll.gameObject.networkView.RPC("Daze", RPCMode.All, true);
			// //coll.gameObject.AddComponent(ControlDisablerDecorator);
			// //coll.gameObject.GetComponent(ControlDisablerDecorator).SetLifetime(1.0);
		// }
		// else if(coll.gameObject.tag == "Hammer")
		// {
			
		// }
		// else if(coll.gameObject.tag == "Bullets")
		// {
			
		// }
	// }
// }

function SpawnAttackEffect()
{
	var go:GameObject = GameObject.Instantiate(m_AttackEffect);
	go.transform.position = transform.position + Vector3.up * 20 + transform.forward*25 + transform.right * 6;
	
	
	go = GameObject.Instantiate(m_AttackEffect);
	go.transform.position = transform.position + Vector3.up * 20 + transform.forward*25 - transform.right * 6;
	go.GetComponent(ParticleSystem).startRotation = Mathf.Deg2Rad*270;
}


