#pragma strict

var m_Cohesion : float = 1;
var m_Separation : float = 1;
var m_SeparationDist : float = 1;
var m_MaxSpeed : float = 1;
var m_SwarmOffset : Vector3;
var m_Owner : GameObject = null;
var m_LargestSize : int = 0; //this variable is used to keep track of how many bees were on the swarm before it got destroyed, this is added to the killing bee's XP total
private var m_AvgPos:Vector3;
static var m_DefaultCohesion : float; 


function Start () {

	if(particleEmitter.particleCount <= 1)
	{
		particleEmitter.ClearParticles();
		var parts =   particleEmitter.particles;
		for(var i = 0; i < parts.length; i++)
		{
			parts[i].position = Random.insideUnitSphere * 2;
			parts[i].velocity = Random.insideUnitSphere;
		}
		particleEmitter.particles = parts;
	}
	
	m_SwarmOffset = Vector3(0,0,0);
	m_DefaultCohesion = m_Cohesion;


}

function Update () {

	//handle flower logic if we are not attached to a bee
	if(transform.parent != null && transform.parent.tag == "Flowers")
	{
		var flower : GameObject = transform.parent.gameObject;
		//make sure our flower does not have the bee on it, to see if we can start adding points
		if(m_Owner.GetComponent(FlowerDecorator) == null ||
			m_Owner.GetComponent(FlowerDecorator).GetFlower() != flower)
		{
			var numBees : float = particleEmitter.particles.length;
			//m_ScoreTimer -= (Time.deltaTime * (numBees / flower.GetComponent(FlowerScript).m_MaxBees));
			var harvestSpeed : float =  (Time.deltaTime * (numBees / flower.GetComponent(FlowerScript).m_MaxBees));
			m_Owner.GetComponent(BeeScript).m_CurrSwmXP += harvestSpeed * flower.GetComponent(FlowerScript).m_SwmXPPerSeconds;
			var beeScript : BeeScript = m_Owner.GetComponent(BeeScript);
			// if(beeScript.m_CurrSwmXP >= beeScript.m_XPToSwmLevel[beeScript.m_CurrSwmLevel])
			// {
				// beeScript.m_CurrSwmLevel++;
				// beeScript.m_CurrSwmXP = 0;
			// }
			
		}
	}

	//handle swarm particle effect motion
	var parts = particleEmitter.particles;
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
				parts[i].velocity = parts[i].velocity.normalized - diff.normalized*m_Separation* Time.deltaTime;
			}
			
			
		}
		
		m_AvgPos /= parts.length;
		m_AvgPos += transform.position - transform.forward *3 + m_SwarmOffset;
		m_AvgPos *= 0.5;
	
		var posDiff = m_AvgPos - parts[i].position;
		parts[i].velocity += posDiff.normalized * m_Cohesion * Time.deltaTime;
		
		parts[i].velocity = parts[i].velocity.normalized * m_MaxSpeed;
		if(transform.parent != null && transform.parent.tag == "Player")
			parts[i].position += (parts[i].velocity+transform.parent.GetComponent(UpdateScript).m_Vel * 0.75) * Time.deltaTime;
		else
			parts[i].position += parts[i].velocity * Time.deltaTime;
			
		parts[i].size = 1.0;
	
	}
	
	particleEmitter.particles = parts;

}

function SetPosition()
{
	var parts = particleEmitter.particles;
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
	particleEmitter.minEmission = count;
	particleEmitter.maxEmission = count;
	//particleEmitter.emit = false;
	particleEmitter.ClearParticles();
	particleEmitter.Simulate(1);
	
	var parts = particleEmitter.particles;
	for(var i = 0; i < parts.length; i++)
	{
		
		parts[i].position = transform.position +Random.insideUnitSphere * 2;
		parts[i].velocity = Random.insideUnitSphere;
		
	}
	
	particleEmitter.particles = parts;	
}

function RemoveParticle()
{
	
	if(particleEmitter.particleCount > 0)
	{
	
		if(particleEmitter.particleCount == 1)
		{
			GetComponent(ParticleRenderer).enabled = false;
		}
		
		var newParts : Particle[]  = new Particle[particleEmitter.particleCount-1];
		for(var i = 0; i < newParts.length; i++)
		{
			newParts[i] = particleEmitter.particles[i];
		}
		
		particleEmitter.particles =  newParts;
	}
}

function AddParticle()
{
	var newParts : Particle[]  = new Particle[particleEmitter.particleCount+1];
	for(var i = 0; i < particleEmitter.particleCount; i++)
	{
		newParts[i] = particleEmitter.particles[i];
		if( i == particleEmitter.particleCount-1)
		{
			newParts[i+1] = particleEmitter.particles[i];
			
			newParts[i+1].position = transform.position +Random.insideUnitSphere * 2;
			newParts[i+1].velocity = Random.insideUnitSphere;
		}
	}
	if(newParts.length > m_LargestSize)
		m_LargestSize = newParts.length;
	particleEmitter.particles =  newParts;
	
	
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
			effect.GetComponent(ParticleSystem).renderer.material.SetColor("_EmisColor", gameObject.renderer.material.color);
			effect.GetComponent(ParticleSystem).startColor = gameObject.renderer.material.color;
			
			effect.transform.position = transform.position;
		}
	}
}

