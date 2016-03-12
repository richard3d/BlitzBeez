#pragma strict
import Dice;

var m_BombExplosion : GameObject = null;
var m_Owner : GameObject = null;
var m_Lifetime : float = 3;

var m_ExplosionSound : AudioClip = null;
var m_BounceSound : AudioClip = null;
var m_ActivateSound : AudioClip = null;
var m_FuseSound : AudioClip = null;

private var m_InitiaPos : Vector3;
private static var m_InstanceID : int = 0;

function Awake()
{
	GetComponent.<Animation>().Play("Bomb");
	gameObject.name = "Bomb"+ ++m_InstanceID;
}
function Start () {

}

function Update () {

	if(Network.isServer)
	{
		var Comp : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
		var Terr:TerrainCollisionScript = GetComponent(TerrainCollisionScript);
		if(Terr != null)
		{
			if(Terr.m_OverTerrain)
			{
				var size:float = transform.localScale.z * GetComponent(SphereCollider).radius;
				if(transform.position.y - size + Comp.m_Vel.y * Time.deltaTime < Terr.m_TerrainInfo.point.y)
				{
						// if(Network.isServer)
						// {	
							// Explode();
							// return;
						// }
					 transform.position.y = size+Terr.m_TerrainInfo.point.y;
				// //	Comp.m_Vel.y *= -0.75;
					Comp.m_Vel = Vector3.Reflect(Comp.m_Vel, Vector3.up)*0.75;
				}		
			}
			
			if(Comp.m_Vel.magnitude < 0.01)
			{
				Comp.m_Vel = Vector3(0,0,0);
				Comp.m_Accel = Vector3(0,0,0);
			}
		}	
	}
}

function OnCollisionEnter(coll : Collision)
{
	if(Network.isServer)
	{
		if(transform.parent == null)
		{
			var Comp : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
			
			if(coll.gameObject.tag == "Bullets" || coll.gameObject.tag == "Explosion")
			{
				Explode();
				return;
			}
			
			if(Comp.m_Vel.magnitude != 0)
			{
				if((coll.gameObject.tag == "Player" && m_Owner != coll.gameObject) || 
					(coll.gameObject.tag == "Flowers" && coll.gameObject.GetComponent(FlowerScript).m_Owner != m_Owner) || 
					coll.gameObject.tag == "Bears" ||
					coll.gameObject.tag == "Rocks" || 
					coll.gameObject.tag == "Trees")
				{
					
					Explode();
					//coll.gameObject.networkView.RPC("Daze", RPCMode.All, false);
				}
				else
				{
					  for (var contact : ContactPoint in coll.contacts) 
					  {
						 Comp.m_Vel = Vector3.Reflect(Comp.m_Vel, contact.normal)*0.75;
						 AudioSource.PlayClipAtPoint(m_BounceSound, Camera.main.transform.position);
						 return;
					  }
				}
			}
		}
	}
}


function OnBulletCollision(coll:BulletCollision)
{
	if(Network.isServer)
	{	
		Explode();
		return;
	}
}

function OnCollisionStay(coll : Collision)
{
	var other : Collider = coll.collider;
	if(other.gameObject.layer == "Terrain")
	{
		GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
		GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
	}
}


@RPC function ActivateItem(owner : String)
{

	var go : GameObject = gameObject.Find(owner);
	if(go != null)
	{
		m_Owner = go;
		go.AddComponent(ItemDecorator);
		go.GetComponent(ItemDecorator).SetItem(gameObject, Vector3(0,1,14), Vector3(0,0,0), false, false);
		go.GetComponent(ItemDecorator).m_MaxSpeed = 75;
		AudioSource.PlayClipAtPoint(m_ActivateSound, Camera.main.transform.position);
		AudioSource.PlayClipAtPoint(m_FuseSound, Camera.main.transform.position);
	}
}

function Explode()
{
	if(Network.isServer)
	{
	
		ServerRPC.Buffer(GetComponent.<NetworkView>(), "KillBomb", RPCMode.All);
		ServerRPC.DeleteFromBuffer(gameObject);
	}
}

@RPC function KillBomb()
{
	AudioSource.PlayClipAtPoint(m_ExplosionSound, m_Owner.GetComponent(BeeScript).m_Camera.transform.position);
	GetComponent(SphereCollider).enabled = false;
	
	//if(m_Owner != null && m_Owner.GetComponent(ItemDecorator) != null)
	//	m_Owner.Destroy(m_Owner.GetComponent(ItemDecorator));
	if(m_Owner != null)
	{
		if(m_Owner.GetComponent(ItemDecorator))
		{
			m_Owner.GetComponent(ItemDecorator).ThrowItem();
			Destroy(m_Owner.GetComponent(ItemDecorator));
		}
	}
	
	
	for (var child : Transform in transform)
	{
		child.gameObject.active = false;
	}
	GetComponent.<Renderer>().enabled = false;
	
	
	var go : GameObject = gameObject.Instantiate(m_BombExplosion);
	go.transform.position = transform.position;
	go.transform.position.y = transform.position.y;
	go.GetComponent(BombExplosionScript).m_Owner = m_Owner;
	Camera.main.GetComponent(CameraScript).Shake(0.25,0.5);
	
	transform.eulerAngles = Vector3(0,0,0);
	var Comp : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
	Comp.m_Vel = Vector3(0,0,0);
	Comp.m_Accel = Vector3(0,0,0);
	m_Owner = null;
	
	Destroy(gameObject);
}
