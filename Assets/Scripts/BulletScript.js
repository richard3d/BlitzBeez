#pragma strict

private static var m_InstanceID : int = 0;
var m_Life : float = 1.25;
var m_HitEffect : GameObject = null;
var m_BombExplosion:GameObject = null; 
var m_HitSoundEffect : AudioClip = null;

var m_MuzzleEffect : GameObject = null;
var m_AttachMuzzleEffect:boolean = true;	//determines if the muzzle effect exists in local (to the player) or world space
var m_PowershotEffect:GameObject = null;

private var m_LaserEffect : GameObject = null;
var m_PowerShot : boolean = false;
var m_BulletType : int = -1;
var m_PowerShotType : int = -1;
var m_Owner : GameObject = null;
var m_Tgt : GameObject = null;
var m_Homing : float = 0;

static var m_BulletPool:Array[] = new Array[5];
static var m_PowerBulletPool:Array[] = new Array[5];


class BulletCollision implements System.IComparable
{
	var hit:RaycastHit;
	var bullet:GameObject;
	
	 function CompareTo(obj: Object) : int {
	 
		var other:BulletCollision = obj;
		return hit.distance.CompareTo(other.hit.distance);
		
     }  
}

static function SpawnBullet(bulletType:GameObject, pos:Vector3, vel:Vector3) : GameObject
{
	var bs:BulletScript = bulletType.GetComponent(BulletScript);
	var go:GameObject = null;
	
	if(bs.m_PowerShot)
	{
		// if(m_PowerBulletPool[bs.m_PowerShotType+1] != null && m_PowerBulletPool[bs.m_PowerShotType+1].length > 0)
		// {
			// go = m_PowerBulletPool[bs.m_PowerShotType+1].Shift();
			// go.transform.position = pos;
			// go.GetComponent(UpdateScript).m_Vel = vel;
			// go.GetComponent(BulletScript).m_Life = 1.25;
			// go.active = true;	
		// }
		// else
		// {
			//instantiate a new one
			go = Network.Instantiate(bulletType, pos , Quaternion.identity, 0);	
		//}
	}
	else
	{
		if(m_BulletPool[bs.m_BulletType+1] != null && m_BulletPool[bs.m_BulletType+1].length > 0)
		{
			go = m_BulletPool[bs.m_BulletType+1].Shift();
			go.transform.position = pos;
			go.GetComponent(UpdateScript).m_Vel = vel;
			go.GetComponent(BulletScript).m_Life = 1.25;
			//go.GetComponent(BulletScript).Start();
			go.active = true;	
		}
		else
		{
			//instantiate a new one
			go = Network.Instantiate(bulletType, pos , Quaternion.identity, 0);	
		}
	}
	return go;
}

static function RecycleBullet(bullet:GameObject)
{
	var bs:BulletScript = bullet.GetComponent(BulletScript);
	if(bs.m_PowerShot)
	{
		if(m_PowerBulletPool[bs.m_PowerShotType+1] == null)
			m_PowerBulletPool[bs.m_PowerShotType+1] = new Array();
		bullet.active = false;
		m_PowerBulletPool[bs.m_PowerShotType+1].Push(bullet);
	}
	else
	{
		if(m_BulletPool[bs.m_BulletType+1] == null)
			m_BulletPool[bs.m_BulletType+1] = new Array();
		bullet.active = false;
		m_BulletPool[bs.m_BulletType+1].Push(bullet);
	}
}

function Awake()
{
	Debug.Log("Awake");
	gameObject.name = "Bullet"+ ++m_InstanceID;
}



function Start () {

	var go : GameObject = gameObject.Instantiate(m_MuzzleEffect);
	var size:float = 1;
	var hit:RaycastHit;
	if(m_PowerShot)
	{
		var systems:Component[] = go.GetComponentsInChildren(ParticleSystem);
		for (var system:ParticleSystem in systems)
		{
			system.startSize *= 1.0;
			size = system.startSize;
		}
		
		//create laser effect if we are a lasershot
		if(m_PowerShotType == 0)
		{
			m_LaserEffect = GameObject.Instantiate(Resources.Load("GameObjects/LaserBeam"), transform.position, transform.rotation);
			m_LaserEffect.transform.localEulerAngles.x = 90;
			m_LaserEffect.GetComponent(LaserBeamScript).m_EndColor = GetComponent(TrailRenderer).material.GetColor("_Emission");
			m_LaserEffect.GetComponent(LaserBeamScript).m_StartColor = m_LaserEffect.GetComponent(LaserBeamScript).m_EndColor*1.5;
			GetComponent(UpdateScript).m_MaxSpeed = 3000;
			GetComponent(UpdateScript).m_Vel = GetComponent(UpdateScript).m_Vel.normalized*3000;
			
		}

	}
	else
	{
		systems = go.GetComponentsInChildren(ParticleSystem);
		for (var system:ParticleSystem in systems)
		{
			system.startSize *= 0.75;
			size = system.startSize;
		}
	}
	
	if(m_Owner)
	{
		go.transform.position =  m_Owner.transform.position+ m_Owner.transform.forward *size;
		go.transform.LookAt(m_Owner.transform.position+ m_Owner.transform.forward *size*2);
		if(m_AttachMuzzleEffect)
			go.transform.parent = m_Owner.transform;
		transform.position.y = m_Owner.transform.position.y;
		
		
		if(Network.isServer)
		{
			var up : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
			up.m_PrevPos = transform.position;
			var radius = (transform.localScale.x * GetComponent(SphereCollider).radius);
			if(Physics.Linecast(m_Owner.transform.position,transform.position+up.m_Vel.normalized * radius,hit))
			{
				//Debug.Log("PASSED");
				if(hit.collider.gameObject != gameObject && hit.collider.gameObject != m_Owner)
				{
					//Debug.Log("COLLISION IN START Happening above");
					var coll:BulletCollision = new BulletCollision();
					coll.hit = hit;
					coll.bullet = gameObject;
					OnBulletCollision(coll);
					hit.collider.gameObject.SendMessage("OnBulletCollision", coll, SendMessageOptions.DontRequireReceiver);
					
				}
				else
				{
					
				}
			}
			else
			{
				//Debug.Log("Coll failed ABOVE"+(m_Owner.transform.position) +" "+ (transform.position+up.m_Vel.normalized * (transform.localScale.x * GetComponent(SphereCollider).radius)+up.m_Vel*Time.deltaTime));
			}
		}
	}
	
	
	//Pick a target for homing bullets
	if(m_BulletType == 2)
	{
		var accuracy:float = -1;
		if(Network.isServer)
		{
			var gos : GameObject[];
			gos = gameObject.FindGameObjectsWithTag("Player");
			
			for(go in gos)
			{
				if(go == m_Owner)
					continue;
				var diff : Vector3 = go.transform.position - transform.position;
				if(Vector3.Dot(diff.normalized, up.m_Vel.normalized) > accuracy)
				{
					accuracy = Vector3.Dot(diff.normalized, up.m_Vel.normalized);
					m_Tgt = go;
				}
			}
		}
	}
	

}

function Update () {

	rigidbody.velocity = Vector3(0,0,0);
	// if(m_Owner == null)
		// return;
	var up : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
	
	var hit:RaycastHit;
	if(Network.isServer)
	{
		//(transform.position+up.m_Vel.normalized * renderer.bounds.extents.x - up.m_PrevPos).magnitude
		var dist = (transform.position - up.m_PrevPos).magnitude;
		if(dist == 0.0)
		{
			dist = up.m_Vel.magnitude*Time.deltaTime;
		}
		var radius = transform.localScale.x * GetComponent(SphereCollider).radius;
		var hits:RaycastHit[];
		hits = Physics.SphereCastAll(up.m_PrevPos,radius,up.m_Vel.normalized, dist);
	    var arr = new Array();
		
		//collect all htis and store them in the bullet collision struct, this is then put into an array for sorting
		if(hits.length > 0)
		{
			//Debug.Log("Coll passed!");
			for(hit in hits)
			{
				if(hit.collider.gameObject != gameObject && hit.collider.gameObject != m_Owner)
				{
					var coll:BulletCollision = new BulletCollision();
					coll.hit = hit;
					coll.bullet = gameObject;
					arr.Push(coll);
				}
			}
		}
		else 
		{
			hits = Physics.RaycastAll(up.m_PrevPos,up.m_Vel.normalized, dist);
			for(hit in hits)
			{
				if(hit.collider.gameObject != gameObject && hit.collider.gameObject != m_Owner)
				{
					coll = new BulletCollision();
					coll.hit = hit;
					coll.bullet = gameObject;
					arr.Push(coll);
				}
			}
			//Debug.Log("Coll failed "+(up.m_PrevPos) +" "+ (up.m_PrevPos+up.m_Vel.normalized * dist)+" "+(transform.localScale.x * GetComponent(SphereCollider).radius));
		}
		
		//sort the bullet collisions (near to far) and process them
		arr.Sort();
		var break1 = false;
		for(coll in arr)
		{
			//Debug.Log("COLL "+coll.hit.collider.gameObject.name);
			
			if(OnBulletCollision(coll))
				break1 = true;
			coll.hit.collider.gameObject.SendMessage("OnBulletCollision", coll, SendMessageOptions.DontRequireReceiver);
			if(break1)
				break;
		}
	
		//homing round seeking
		if(m_BulletType == 2)
		{
			if(m_Tgt != null)
			{
				if(Physics.Linecast(transform.position,m_Tgt.transform.position,hit))
				{
					if(hit.collider.gameObject == gameObject || hit.collider.gameObject == m_Tgt)
					{
						
						var diff : Vector3 = m_Tgt.transform.position - transform.position+Vector3(0,10,0);
						var homing :float = Mathf.Max(0.3,Mathf.Abs(Vector3.Dot(up.m_Vel.normalized, diff.normalized)))*0.15;
						
						up.m_Vel = Vector3.Slerp(up.m_Vel, diff.normalized * up.m_Vel.magnitude, homing);
						up.m_Vel.y = 0;
						transform.LookAt(transform.position+up.m_Vel);
						//up.m_Vel += diff.normalized * homing ;
					}
				}
				else
				{
						diff = m_Tgt.transform.position - transform.position+Vector3(0,10,0);
						homing = Mathf.Max(0.3,Mathf.Abs(Vector3.Dot(up.m_Vel.normalized, diff.normalized)))*0.15;
						up.m_Vel = Vector3.Slerp(up.m_Vel, diff.normalized * up.m_Vel.magnitude, homing);
						up.m_Vel.y = 0;
						transform.LookAt(transform.position+up.m_Vel);
						//up.m_Vel += diff.normalized * homing ;
				}
			}
		}
	}
	
	
	
	
	if(m_PowerShot)
	{
		transform.LookAt(transform.position + up.m_Vel);
		
		if(m_PowerShotType == 0)
		{
			if(m_LaserEffect != null)
			{
				var length:float = (transform.position - m_Owner.transform.position).magnitude;
				m_LaserEffect.GetComponent(LaserBeamScript).m_EndScale.y = length*2;
				m_LaserEffect.GetComponent(LaserBeamScript).m_StartScale.y = length*2;	
			}
		}
	}
	
	if(Network.isClient)
		return;
		
	if(	m_Life > 0.0)
	{
		m_Life -= Time.deltaTime;	
		if(m_Life <= 0.0)
		{
		
			ServerRPC.Buffer(networkView, "KillBullet", RPCMode.All, gameObject.transform.position);
			ServerRPC.DeleteFromBuffer(gameObject);
			//GameObject.Find("GameServer").GetComponent(ServerScript).m_SyncMsgsView.RPC("NetworkDestroy", RPCMode.All, gameObject.name);
		}
	}

}


function OnBulletCollision(coll:BulletCollision) : boolean
{
	//Debug.Log("BULLET COLLISION: "+coll.hit.collider.gameObject.name );
	var tag:String = coll.hit.collider.gameObject.tag;
	var other:GameObject = coll.hit.collider.gameObject;
	if(coll.hit.collider.isTrigger)
	{
		if(tag != "Flowers" && tag != "Hives")
			return false;
	}
	
	
	
	if(m_PowerShot)
	{
		switch (m_PowerShotType)
		{
			//standard (-1) laser {0} explosive (1) scatter(2) bull (3) homing spread (4)
		    case 0:
				 if(tag == "Rocks" || tag == "Terrain" || tag == "Trees" || tag == "ItemBoxes" ||  
				   (tag == "Hives" && other.GetComponent(HiveScript).m_Owner != m_Owner) ||
				   (tag == "Flowers" && other.GetComponent(FlowerScript).m_Owner != null && other.GetComponent(FlowerScript).m_Owner != m_Owner))
				   {
						if(m_LaserEffect != null)
						{
							//Debug.Log("SHORTENING");
							var diff:Vector3 = (coll.hit.point - transform.position);
							diff = Vector3.Project(diff, GetComponent(UpdateScript).m_Vel.normalized);
							var length:float = (coll.hit.point - transform.position).magnitude;
							m_LaserEffect.GetComponent(LaserBeamScript).m_EndScale.y = length*2;
							m_LaserEffect.GetComponent(LaserBeamScript).m_StartScale.y = length*2;	
						}
						var pos = transform.position;
						transform.position = coll.hit.point;
						RemoveBullet(pos+diff);
						return true;
				   }
				   else
				   {
						ServerRPC.Buffer(networkView, "BulletHit", RPCMode.All, coll.hit.point);
				   }
			break;
			case 2:
				if( tag == "Player" || tag == "Rocks" || tag == "Terrain" || tag == "Trees" || tag == "ItemBoxes" ||  
				   (tag == "Hives" && other.GetComponent(HiveScript).m_Owner != m_Owner)||
				   (tag == "Flowers" && other.GetComponent(FlowerScript).m_Owner != null && other.GetComponent(FlowerScript).m_Owner != m_Owner))
				{
					var refNorm : Vector3 = coll.hit.normal;
					refNorm.y = 0;
					refNorm.Normalize();
					var refVel : Vector3 = Vector3.Reflect(GetComponent(UpdateScript).m_Vel, refNorm);
					refVel.y = 0;
					//Debug.Log("NORMAL " +refVel);
					refVel.Normalize();
					GetComponent(UpdateScript).m_Vel = refVel;
					//creates splinter bullet
					//m_PowerShotType = -1; 
					//create shrapnel bullets
					for(var i = 0 ; i < 9; i++)
					{
						var rot :Quaternion = Quaternion.AngleAxis((i-4) * 15,Vector3.up); 
						if( i == 0)
						{
							rot = Quaternion.identity;
						}
						refVel = rot*refNorm;
						var go : GameObject  = Network.Instantiate(Resources.Load("GameObjects/FletchetBullet"), transform.position + refVel * 2, Quaternion.LookRotation(refVel, Vector3.up), 0);	
						go.GetComponent(BulletScript).m_BulletType = 0;
						m_Owner.networkView.RPC("Shot", RPCMode.All, go.name, go.transform.position+ refVel * 2, refVel * go.GetComponent(UpdateScript).m_MaxSpeed*Random.Range(0.6,1), false);
					}
					
					RemoveBullet(coll.hit.point);	
				}
				return true;
			break;
				//bulldozer powerbullet
				case 3:
				//these are objects we doze (pass through) and trigger a response out of (like destroying a rock)
				if( tag == "Player" || tag == "Rocks"  || tag == "ItemBoxes")
				{
					ServerRPC.Buffer(networkView, "BulletHitOriented", RPCMode.All, transform.position+transform.forward * transform.localScale.x, GetComponent(UpdateScript).m_Vel.normalized);
					if(GetComponent(PauseDecorator) == null)
					{
						gameObject.AddComponent(PauseDecorator);
						GetComponent(PauseDecorator).m_Lifetime = 0.12;
					}
					return false;
				}
				//items we pass through but do not trigger any response
				else if(tag =="Coins" || tag == "Items" 
						|| (tag == "Flowers" && (other.GetComponent(FlowerScript).m_Owner == null || other.GetComponent(FlowerScript).m_Owner == m_Owner))
						|| (tag == "Hives" && (other.GetComponent(HiveScript).m_Owner == null || other.GetComponent(HiveScript).m_Owner == m_Owner)))
				{
				}
				//solid items we should not pass through at all
				else 
				{
					RemoveBulletOriented(coll.hit.point, coll.hit.normal);
					return true;
				}
			break;
			default:
			if(tag == "Player" || tag == "Rocks" ||  tag == "Terrain" || tag == "Trees" || tag == "Bears" || tag == "ItemBoxes" ||
				  (tag == "Hives" && other.GetComponent(HiveScript).m_Owner != m_Owner)||
				   (tag == "Flowers" && other.GetComponent(FlowerScript).m_Owner != null && other.GetComponent(FlowerScript).m_Owner != m_Owner))
				  {
					RemoveBullet(coll.hit.point);
					return true;
				}
				else if(tag == "Shield" )
					{
						if(other.GetComponent(FlowerShieldScript).m_Owner != m_Owner)
						{
							RemoveBullet(coll.hit.point);
							return true;
						}
					}
			break;
		}
	}
	else
	{
		switch (m_BulletType)
		{
			//ricochet type
			case 0: 
				refNorm = coll.hit.normal;
				refNorm.y = 0;
				refNorm.Normalize();
				refVel = Vector3.Reflect(GetComponent(UpdateScript).m_Vel, refNorm);
				refVel.y = 0;
				m_BulletType = -1;
				refVel.Normalize();
				GetComponent(UpdateScript).m_Vel = refVel*GetComponent(UpdateScript).m_MaxSpeed;
				transform.LookAt(transform.position + GetComponent(UpdateScript).m_Vel);
				ServerRPC.Buffer(networkView, "BulletHit", RPCMode.All, transform.position+transform.forward * transform.localScale.x);
			break;
			//penetration
			case 1:
				if(coll.hit.collider.gameObject.GetComponent(PenetrableScript) != null)
				{
					var sum = Dice.RollDice(1, 6);
					if(sum/6.0 > (1-coll.hit.collider.gameObject.GetComponent(PenetrableScript).m_PercentChanceOfPenetration))
					{
						//m_BulletType = -1;
						ServerRPC.Buffer(networkView, "BulletHit", RPCMode.All, transform.position+transform.forward * transform.localScale.x);
					}
					else
					{
						
						RemoveBullet(transform.position+transform.forward * transform.localScale.x);
						return true;
					
					}
				}
				else
				{
					RemoveBullet(transform.position+transform.forward * transform.localScale.x);
					return true;
				}
			break;
			case 2:
				if((tag == "Player" && other.GetComponent(BeeDashDecorator) == null) || tag == "Rocks" ||   tag == "Terrain" || tag == "Trees" || tag == "Bears" ||  tag == "ItemBoxes" ||
				  (tag == "Hives" && other.GetComponent(HiveScript).m_Owner != m_Owner) ||
				  (tag == "Flowers" && other.GetComponent(FlowerScript).m_Owner != null))
				  {
					
						RemoveBullet(coll.hit.point);
						return true;
					}	
					else if(tag == "Shield" )
					{
						if(other.GetComponent(FlowerShieldScript).m_Owner != m_Owner)
						{
							RemoveBullet(coll.hit.point);
							return true;
						}
					}
			break;
			default:
		
				if((tag == "Player" && other.GetComponent(BeeDashDecorator) == null) || tag == "Rocks" ||   tag == "Terrain" || tag == "Trees" || tag == "Bears" ||  tag == "ItemBoxes" ||
				  (tag == "Hives" && other.GetComponent(HiveScript).m_Owner != m_Owner) ||
				  (tag == "Flowers" && other.GetComponent(FlowerScript).m_Owner != null && other.GetComponent(FlowerScript).m_Owner != m_Owner))
				  {
					
						RemoveBullet(coll.hit.point);
						return true;
					}	
					else if(tag == "Shield" )
					{
						if(other.GetComponent(FlowerShieldScript).m_Owner != m_Owner)
						{
							RemoveBullet(coll.hit.point);
							return true;
						}
					}
			break;
		}
	}
	return false;
}




@RPC function BulletHitOriented(pos:Vector3, norm:Vector3)
{
	var go : GameObject = gameObject.Instantiate(m_HitEffect);
	go.transform.position = pos;
	go.transform.LookAt(pos+norm);
	if(m_PowerShot)
	{
		if(renderer.isVisible)
			Camera.main.GetComponent(CameraScript).Shake(0.25,2);
	}
}

@RPC function BulletHit(pos:Vector3)
{
	var go : GameObject = gameObject.Instantiate(m_HitEffect);
	go.transform.position = pos;
	if(m_PowerShot)
	{
		if(renderer.isVisible)
			Camera.main.GetComponent(CameraScript).Shake(0.25,2);
	}
}

function RemoveBulletOriented(pos:Vector3, norm:Vector3)
{
	//this function first checs if the bullet is already marked as 'dead' (by checking the lifespan)
	//it is possible a bullet collides with multiple objects at once but we can only have the rpc call happen once
	//otherwise the client destroys the bullet and another RPC arrives from the server due to second collision
	if(m_Life > 0)
	{
		ServerRPC.Buffer(networkView, "KillBulletOriented", RPCMode.All, pos, norm);
		ServerRPC.DeleteFromBuffer(gameObject);
	}
	m_Life = -1;
}

function RemoveBullet(pos:Vector3)
{
	//this function first checs if the bullet is already marked as 'dead' (by checking the lifespan)
	//it is possible a bullet collides with multiple objects at once but we can only have the rpc call happen once
	//otherwise the client destroys the bullet and another RPC arrives from the server due to second collision
	if(m_Life > 0)
	{
		ServerRPC.Buffer(networkView, "KillBullet", RPCMode.All, pos);
		ServerRPC.DeleteFromBuffer(gameObject);
	}
	m_Life = -1;
}

@RPC
function KillBulletOriented(pos:Vector3, norm:Vector3)
{
	var go : GameObject = gameObject.Instantiate(m_HitEffect);
	go.transform.position = pos+norm;
	go.transform.LookAt(pos+norm*2);
	if(m_PowerShot)
	{
		switch (m_PowerShotType)
		{
			//explosive
			case 1: 
				go = gameObject.Instantiate(m_BombExplosion, transform.position, Quaternion.identity);
				//go.transform.position = transform.position;
				
				Camera.main.GetComponent(CameraScript).Shake(0.25,0.5);
			break;
			//scatter
			case 2: 
				
			break;
		}
		

	}
	if(m_HitSoundEffect != null)
		AudioSource.PlayClipAtPoint(m_HitSoundEffect, pos);
	Destroy(gameObject);
} 

@RPC
function KillBullet(pos:Vector3)
{
	var go : GameObject = gameObject.Instantiate(m_HitEffect);
	go.transform.position = pos;
	
	if(m_PowerShot)
	{
		switch (m_PowerShotType)
		{
			//explosive
			case 1: 
				go = gameObject.Instantiate(m_BombExplosion, transform.position, Quaternion.identity);
				go.transform.position = transform.position;
				
				Camera.main.GetComponent(CameraScript).Shake(0.25,0.5);
			break;
			//scatter
			case 2: 
				
			break;
		}
		

	}
	if(m_HitSoundEffect != null)
		AudioSource.PlayClipAtPoint(m_HitSoundEffect, pos);
	
	RecycleBullet(gameObject);
	if(m_PowerShot)
		Destroy(gameObject);
} 

@RPC function RemoveComponent(compName:String)
{
	DestroyImmediate(GetComponent(compName));
}

@RPC
function DamageHive(hiveName:String, dmgAmt:int)
{
	var hive:GameObject = gameObject.Find(hiveName);
	hive.GetComponent(HiveScript).m_HP -= dmgAmt;
	
	
	if(hive.GetComponent(FlasherDecorator) == null)
	{
		hive.AddComponent(FlasherDecorator);
		hive.GetComponent(FlasherDecorator).m_FlashDuration = 0.1;
		hive.GetComponent(FlasherDecorator).m_NumberOfFlashes = 1;
	}
	
	if(hive.GetComponent(HiveScript).m_HP <= 0)
	{
		//destroy the hive
		Destroy(gameObject.Find(hiveName));
	}
	else
		hive.GetComponent(HiveScript).m_LifebarTimer = 2;
}