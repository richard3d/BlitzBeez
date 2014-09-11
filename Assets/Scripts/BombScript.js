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
	animation.Play("Bomb");
	gameObject.name = "Bomb"+ ++m_InstanceID;
}
function Start () {

}

function Update () {

	if(Network.isServer)
	{
		var Comp : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
		if(transform.position.y - transform.localScale.y + Comp.m_Vel.y * Time.deltaTime < 0)
		{
			transform.position.y = transform.localScale.y;
			Comp.m_Vel.y *= -0.75;
		}
		
		if(Comp.m_Vel.magnitude < 0.01)
		{
			Comp.m_Vel = Vector3(0,0,0);
			Comp.m_Accel = Vector3(0,0,0);
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
			
			if(coll.gameObject.tag == "Bullets" )
			{
				Explode();
				return;
			}
			
			if(Comp.m_Vel.magnitude != 0)
			{
				if(coll.gameObject.tag == "Player" && m_Owner != coll.gameObject)
				{
					Explode();
					//coll.gameObject.networkView.RPC("Daze", RPCMode.All, false);
				}
				else
				{
					  for (var contact : ContactPoint in coll.contacts) 
					  {
						 Comp.m_Vel = Vector3.Reflect(Comp.m_Vel, contact.normal) * 0.5;
						 AudioSource.PlayClipAtPoint(m_BounceSound, Camera.main.transform.position);
						 return;
					  }
				}
			}
		}
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
		go.GetComponent(ItemDecorator).m_MaxSpeed = 50;
		AudioSource.PlayClipAtPoint(m_ActivateSound, Camera.main.transform.position);
		AudioSource.PlayClipAtPoint(m_FuseSound, Camera.main.transform.position);
	}
}

function Explode()
{
	if(Network.isServer)
	{
		Debug.Log("Killing Bomb");
		ServerRPC.Buffer(networkView, "KillBomb", RPCMode.All);
		ServerRPC.DeleteFromBuffer(gameObject);
	}
}

@RPC function KillBomb()
{
	AudioSource.PlayClipAtPoint(m_ExplosionSound, Camera.main.transform.position);
	GetComponent(SphereCollider).enabled = false;
	
	//if(m_Owner != null && m_Owner.GetComponent(ItemDecorator) != null)
	//	m_Owner.Destroy(m_Owner.GetComponent(ItemDecorator));
	if(m_Owner != null)
	{
		if(m_Owner.GetComponent(ItemDecorator))
			m_Owner.GetComponent(ItemDecorator).ThrowItem();
	}
	
	
	for (var child : Transform in transform)
	{
		child.gameObject.active = false;
	}
	renderer.enabled = false;
	
	
	var go : GameObject = gameObject.Instantiate(m_BombExplosion);
	go.transform.position = transform.position;
	go.transform.position.y = 0;
	Camera.main.GetComponent(CameraScript).Shake(0.25,0.5);
	
	transform.eulerAngles = Vector3(0,0,0);
	var Comp : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
	Comp.m_Vel = Vector3(0,0,0);
	Comp.m_Accel = Vector3(0,0,0);
	m_Owner = null;
	
	Destroy(gameObject);
}
