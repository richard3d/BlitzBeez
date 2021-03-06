#pragma strict

var m_Cohesion : float = 1;
var m_Separation : float = 1;
var m_SeparationDist : float = 1;
var m_MaxSpeed : float = 1;
var m_MaxDist :float = 40;
var m_SwarmOffset : Vector3;
var m_Owner : GameObject = null;
var m_LargestSize : int = 0; //this variable is used to keep track of how many bees were on the swarm before it got destroyed, this is added to the killing bee's XP total
private var m_AvgPos:Vector3;
static var m_DefaultCohesion : float; 


function Start () {

	if(GetComponent.<ParticleEmitter>().particleCount <= 1)
	{
		GetComponent.<ParticleEmitter>().ClearParticles();
		var parts =   GetComponent.<ParticleEmitter>().particles;
		for(var i = 0; i < parts.length; i++)
		{
			parts[i].position = Random.insideUnitSphere * 2;
			parts[i].velocity = Random.insideUnitSphere;
		}
		GetComponent.<ParticleEmitter>().particles = parts;
	}
	
	m_SwarmOffset = Vector3(0,0,0);
	m_DefaultCohesion = m_Cohesion;


}

function Update () {

	var fDelta = Time.deltaTime;
	//handle flower logic if we are not attached to a bee
	if(transform.parent != null && transform.parent.tag == "Flowers")
	{
		var flower : GameObject = transform.parent.gameObject;
		//make sure our flower does not have the bee on it, to see if we can start adding points
		if(m_Owner != null && m_Owner.GetComponent(FlowerDecorator) == null ||
			m_Owner.GetComponent(FlowerDecorator).GetFlower() != flower)
		{
			var numBees : float = GetComponent.<ParticleEmitter>().particles.length;
			var harvestSpeed : float =  (fDelta* (numBees / flower.GetComponent(FlowerScript).m_MaxBees));
			var beeScript : BeeScript = m_Owner.GetComponent(BeeScript);
		}
	}

	//handle swarm particle effect motion
	var parts = GetComponent.<ParticleEmitter>().particles;
	for(var i = 0; i < parts.length; i++)
	{
		m_AvgPos  = Vector3(0,0,0);
		var Sep: Vector3;
		for(var k = 0; k < parts.length; k++)
		{
			var diff : Vector3 = parts[k].position - parts[i].position;
			m_AvgPos += parts[k].position;
			if(k == i)
				continue;
			if(diff.magnitude < m_SeparationDist)
			{
				parts[i].velocity = parts[i].velocity.normalized - diff.normalized*m_Separation* fDelta;
			}
			
			
		}
		
		m_AvgPos /= parts.length;
		m_AvgPos += transform.position - transform.forward *3 + m_SwarmOffset;
		m_AvgPos *= 0.5;
	
		var posDiff = m_AvgPos - parts[i].position;
		parts[i].velocity += posDiff.normalized * m_Cohesion * fDelta;
		
		parts[i].velocity = parts[i].velocity.normalized * m_MaxSpeed;
		if(transform.parent != null && transform.parent.tag == "Player")
			parts[i].position += (parts[i].velocity+transform.parent.GetComponent(UpdateScript).m_Vel * 0.75) * fDelta;
		else
			parts[i].position += parts[i].velocity * fDelta;
			
		var v:Vector3 = parts[i].velocity;
		//v.z = 0;
		v = v.normalized;
		var dot:float = Vector3.Dot(v, Vector3.right);
		var ang:float = Mathf.Rad2Deg*Vector3.Dot(v, Vector3.up);
		if(dot < 0)
		 ang = -ang;
		parts[i].rotation = Mathf.Rad2Deg*Vector3.Dot(parts[i].velocity.normalized, Vector3.up);
		
			
		
		//HAXE
		if((parts[i].position-transform.position).magnitude > m_MaxDist)
				parts[i].position = transform.position+(transform.position-parts[i].position).normalized*m_MaxDist;
		
		//parts[i].size = 1.0;
	
	}
	
	GetComponent.<ParticleEmitter>().particles = parts;

}

function SetPosition()
{
	var parts = GetComponent.<ParticleEmitter>().particles;
	if(transform.parent != null && transform.parent.tag == "Player")
	{
			
		for(var i = 0; i < parts.length; i++)
		{
			parts[i].position += transform.parent.position - m_AvgPos;
		}
	}
}

function SetNumParticles(count : int)
{
	if(count > m_LargestSize)
		m_LargestSize = count;
	GetComponent.<ParticleEmitter>().minEmission = count;
	GetComponent.<ParticleEmitter>().maxEmission = count;
	//particleEmitter.emit = false;
	GetComponent.<ParticleEmitter>().ClearParticles();
	GetComponent.<ParticleEmitter>().Simulate(1);
	
	var parts = GetComponent.<ParticleEmitter>().particles;
	for(var i = 0; i < parts.length; i++)
	{
		
		parts[i].position = transform.position +Random.insideUnitSphere * 2;
		parts[i].velocity = Random.insideUnitSphere;
		
	}
	
	GetComponent.<ParticleEmitter>().particles = parts;	
}

function RemoveParticle()
{
	
	if(GetComponent.<ParticleEmitter>().particleCount > 0)
	{
	
		if(GetComponent.<ParticleEmitter>().particleCount == 1)
		{
			GetComponent(ParticleRenderer).enabled = false;
		}
		
		var newParts : Particle[]  = new Particle[GetComponent.<ParticleEmitter>().particleCount-1];
		for(var i = 0; i < newParts.length; i++)
		{
			newParts[i] = GetComponent.<ParticleEmitter>().particles[i];
		}
		
		GetComponent.<ParticleEmitter>().particles =  newParts;
	}
}

function AddParticle()
{
	var newParts : Particle[]  = new Particle[GetComponent.<ParticleEmitter>().particleCount+1];
	for(var i = 0; i < GetComponent.<ParticleEmitter>().particleCount; i++)
	{
		newParts[i] = GetComponent.<ParticleEmitter>().particles[i];
		if( i == GetComponent.<ParticleEmitter>().particleCount-1)
		{
			newParts[i+1] = GetComponent.<ParticleEmitter>().particles[i];
			
			newParts[i+1].position = transform.position +Random.insideUnitSphere * 2;
			newParts[i+1].velocity = Random.insideUnitSphere;
		}
	}
	if(newParts.length > m_LargestSize)
		m_LargestSize = newParts.length;
	GetComponent.<ParticleEmitter>().particles =  newParts;
	
	
}

function OnDestroy()
{
	if(Application.isEditor)
		return;
	if(transform.parent != null && transform.parent.gameObject.tag == "Flowers")
	{
		var go : Transform = transform.parent.gameObject.transform.Find("Shield");
		if(go != null)
		{
			gameObject.Destroy(go.gameObject);
			var effect : GameObject = gameObject.Instantiate(Resources.Load("GameObjects/BeeExplosionParticles"));
			var parts : ParticleSystem.Particle[] = new ParticleSystem.Particle[effect.GetComponent(ParticleSystem).particleCount];
			effect.GetComponent(ParticleSystem).GetComponent.<Renderer>().material.SetColor("_EmisColor", gameObject.GetComponent.<Renderer>().material.color);
			effect.GetComponent(ParticleSystem).startColor = gameObject.GetComponent.<Renderer>().material.color;
			
			effect.transform.position = transform.position;
		}
	}
}

