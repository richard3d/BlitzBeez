#pragma strict

private static var m_InstanceID : int = 0;
var m_Owner:GameObject = null;
private var m_Timer:float = 0;
var m_Time:float = 1;
var m_PickupEffect : GameObject = null;
var m_PickUpSound : AudioClip = null;
var m_LevelUpSound : AudioClip = null;
function Awake()
{
	
	gameObject.name = "Pollen";
	GetComponent.<Animation>().Play("SpawnPollen");
}

function Start () {

	m_Timer = 0;
	transform.eulerAngles = Vector3(45,180,0);

}

function PollenSpawned()
{
	GetComponent.<Animation>().Play("Pollen");
}

function Update () {

	if(m_Owner != null)
	{
		m_Timer += Time.deltaTime;
		if(m_Timer <= m_Time)
		{
			transform.position += (m_Owner.transform.position - transform.position)*  (m_Timer/m_Time);
			var scale:float = (1-m_Timer/m_Time)* 0.05;
			transform.localScale = Vector3(scale,scale,scale);
		}
		
		if((m_Owner.transform.position - transform.position).magnitude < m_Owner.transform.localScale.x)
		{
			GetComponent.<AudioSource>().PlayClipAtPoint(m_PickUpSound, Camera.main.transform.position);
			if(m_Owner.GetComponent(FlasherDecorator) == null)
				m_Owner.AddComponent(FlasherDecorator);
			m_Owner.AddComponent(PauseDecorator);
			m_Owner.GetComponent(PauseDecorator).m_Lifetime = 0.25;
			var effect : GameObject = gameObject.Instantiate(m_PickupEffect);
	
			effect.transform.position = m_Owner.transform.position;
			m_Owner.transform.localScale += Vector3(0.5,0.5,0.5);
			if((m_Owner.GetComponent(BeeScript).m_PollenCount+1)%3 == 0)
			{
				GetComponent.<AudioSource>().PlayClipAtPoint(m_LevelUpSound, Camera.main.transform.position);
				if(m_Owner.transform.localScale.x == 2)
				{
					m_Owner.GetComponent.<Animation>().Play("BeeLevelUp1");
					}
			//	m_Owner.transform.localScale += Vector3(1,1,1);
				
				if(m_Owner.transform.localScale.x == 3)
				{
					//m_Owner.animation.Stop();
					m_Owner.GetComponent.<Animation>().Play("BeeLevelUp2");
				}
			}
			m_Owner.GetComponent(BeeScript).m_PollenCount++;
			Destroy(gameObject);
		}
	}

}


function OnCollisionEnter(coll : Collision)
{

}