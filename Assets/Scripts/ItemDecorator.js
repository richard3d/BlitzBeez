//this script is intended to behave like a decorator

#pragma strict

private var  m_PrevMaxSpeed : float; //variable to store the previous max speed of the entity so we can alter it and set it back
private var m_Item : GameObject = null; //the actual object we are carrying
private var m_AngleOffset : Vector3; //the angle difference between the item and the carrier
private var m_PosOffset : Vector3; // the  position difference between the item and the carrier
private var m_WorldPosOffset : boolean = false; //is the position offset based on world coordinates?
private var m_WorldAngleOffset : boolean = false; //is the angle offset based on world angles?
private var m_FirstInput : boolean = true;



var m_ThrowVelocityScalar : float = 2;

var m_MaxSpeed : float;		//the max speedd the entity can move when carrying this item

function Awake()
{
	m_FirstInput = true;
	m_ThrowVelocityScalar = 1;
	m_PrevMaxSpeed = GetComponent(UpdateScript).m_DefaultMaxSpeed;
}

function Start () {

	GetComponent(BeeControllerScript).m_AttackEnabled = false;

}

function Update () {
	
	GetComponent(UpdateScript).m_MaxSpeed = m_MaxSpeed;
	
	if(m_Item)
	{
		//make the swarm, form around the object
		if(GetComponentInChildren(BeeParticleScript) != null)
			GetComponentInChildren(BeeParticleScript).m_SwarmOffset =  (m_Item.transform.position-transform.position)*1.0 + Vector3(0,8,0);
		
		m_Item.transform.parent = null;
		m_Item.transform.eulerAngles = transform.eulerAngles+m_AngleOffset;
		m_Item.transform.position = transform.position +  m_PosOffset.x * transform.right + m_PosOffset.y * transform.up+ m_PosOffset.z * transform.forward;
		//make the obejct bob
		m_Item.transform.position.y = transform.position.y + Mathf.Sin(Time.time*6)*6+6;
	}
}

function OnNetworkInput(IN : InputState)
{
	if(!networkView.isMine)
	{
		return;
	}
	
	
	
	if(m_Item == null)
		return;
		
		
	//handle use action
	if(IN.GetActionUpBuffered(IN.USE))
	{
		if(m_FirstInput)
		{
			 m_FirstInput = false;
			return;
		}
		if(m_Item != null)
		{
			ServerRPC.Buffer(networkView, "ThrowItem", RPCMode.All);
		}
	}
	
	if(IN.GetAction(IN.USE))
	{
		m_ThrowVelocityScalar += Time.deltaTime*4;
		m_ThrowVelocityScalar = Mathf.Min(m_ThrowVelocityScalar, 3);
	}
	
	
	
}

@RPC function ThrowItem()
{
	if(m_Item == null)
		return;
	AudioSource.PlayClipAtPoint(GetComponent(BeeControllerScript).m_ThrowSound, Camera.main.transform.position);
	if(Network.isServer)
		m_Item.GetComponent(UpdateScript).MakeNetLive();
	
	//let the entity move normal again
	GetComponent(UpdateScript).m_MaxSpeed = m_PrevMaxSpeed;
	
	//unchain ourselves from the parent and dissable collision with the owner entity
	m_Item.transform.parent = null;
	if(m_Item != null && m_Item.collider != null && m_Item.collider.active && gameObject.collider.active)
		Physics.IgnoreCollision(gameObject.collider, m_Item.collider, false);
		
	if(m_Item.tag == "Rocks")
	{
		m_Item.GetComponent(RockScript).m_Owner = gameObject;
		m_Item.GetComponent(UpdateScript).m_Vel = (transform.forward ) * GetComponent(UpdateScript).m_DefaultMaxSpeed * m_ThrowVelocityScalar;//  + transform.up*0.15* GetComponent(UpdateScript).m_DefaultMaxSpeed * m_ThrowVelocityScalar ;
		m_Item.transform.position = transform.position + transform.forward * 10 + transform.up * 20;
		m_Item.GetComponent(UpdateScript).m_Accel.y = -79.8 * (3/m_ThrowVelocityScalar);
		m_Item.GetComponent(TrailRenderer).enabled = true;
		gameObject.AddComponent(ControlDisablerDecorator);
		GetComponent(ControlDisablerDecorator).SetLifetime(0.5);	
	}
	else if(m_Item.tag == "Bombs")
	{
		m_Item.GetComponent(BombScript).m_Owner = gameObject;
		m_Item.GetComponent(UpdateScript).m_Vel = (transform.forward)  * GetComponent(UpdateScript).m_DefaultMaxSpeed * m_ThrowVelocityScalar;
		m_Item.transform.position = transform.position + transform.forward * 10 + transform.up * 20;
		m_Item.GetComponent(UpdateScript).m_Accel.y = -79.8 * (3/m_ThrowVelocityScalar);
		gameObject.AddComponent(ControlDisablerDecorator);
		GetComponent(ControlDisablerDecorator).SetLifetime(0.5);
	}
	else if(m_Item.tag == "Mines")
	{
		m_Item.GetComponent(MineScript).m_Owner = gameObject;
		m_Item.GetComponent(UpdateScript).m_Vel = (transform.forward) * GetComponent(UpdateScript).m_DefaultMaxSpeed * m_ThrowVelocityScalar;
		m_Item.transform.position = transform.position + transform.forward * 10 + transform.up * 10;
		m_Item.GetComponent(UpdateScript).m_Accel.y = -79.8 * (3/m_ThrowVelocityScalar);
		gameObject.AddComponent(ControlDisablerDecorator);
		GetComponent(ControlDisablerDecorator).SetLifetime(0.5);
	}
	
	
	
	if(Network.isServer)
		ServerRPC.Buffer(networkView,"RemoveComponent", RPCMode.All, "ItemDecorator");
} 

function OnDestroy()
{
	//make the swarm go back to their original formation
	var comp : BeeParticleScript = GetComponentInChildren(BeeParticleScript) as BeeParticleScript;
	if(comp != null)
	{
		comp.m_SwarmOffset =  Vector3(0,0,0);
		comp.m_Cohesion = GetComponentInChildren(BeeParticleScript).m_DefaultCohesion;
	}
	
	GetComponent(BeeControllerScript).m_AttackEnabled = true;
}




function GetItem() : GameObject
{
	return m_Item;
}

function SetItem (go : GameObject, itemPosOffset : Vector3, itemOrientation : Vector3, worldPosOffset : boolean, worldAngleOffset : boolean)
{
	m_Item = go;
	m_PosOffset = itemPosOffset;
	m_AngleOffset = itemOrientation;
	m_WorldPosOffset = worldPosOffset;
	m_WorldAngleOffset = worldAngleOffset;
	if(go.collider != null)
		Physics.IgnoreCollision(m_Item.collider, gameObject.collider, true);
	
	if(go.tag == "Rocks")
	{
		m_Item.GetComponent(RockScript).m_Owner = gameObject;
		GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
		GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
		gameObject.AddComponent(ControlDisablerDecorator);
		GetComponent(ControlDisablerDecorator).SetLifetime(0.5);
		
		var diff: Vector3 = transform.position - m_Item.transform.position;
		diff.Normalize();
		
		var Dot : float = 0.0;
		if(Vector3.Dot(diff, Vector3.right) > Dot)
		{
			transform.LookAt(transform.position - Vector3.right);
			
			Dot = Vector3.Dot(diff, Vector3.right);
		}
		if(Vector3.Dot(diff, -Vector3.right) > Dot)
		{
			transform.LookAt(transform.position + Vector3.right);
			Dot = Vector3.Dot(diff, -Vector3.right);
		}
		if(Vector3.Dot(diff, Vector3.forward) > Dot)
		{
			transform.LookAt(transform.position - Vector3.forward);
			Dot = Vector3.Dot(diff, Vector3.forward);
		
		}
		if(Vector3.Dot(diff, -Vector3.forward) > Dot)
		{
			transform.LookAt(transform.position + Vector3.forward);
			
			Dot = Vector3.Dot(diff, -Vector3.forward);
		}
	}
	else if(go.tag == "Bombs")
	{
		m_Item.GetComponent(BombScript).m_Owner = gameObject;
	}
	
	
	//transform.position = m_Item.transform.position;
	// m_Item.transform.parent = transform;
	// m_Item.transform.eulerAngles = itemOrientation;
	// m_Item.transform.position = transform.position;
	// m_Item.transform.position += itemPosOffset.x * transform.right + itemPosOffset.y * transform.up+ itemPosOffset.z * transform.forward;
	
}

