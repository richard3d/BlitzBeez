#pragma strict

private static var m_InstanceID:int = 0;
var m_Owner:GameObject;
var m_DestPoint:Vector3;
private var m_SpawnFlightTime:float = 0.2; //time to fly to flower from spawn location
private var m_SpawnFlightTimer:float = 0; //time to fly to flower from spawn location

function Start () {
	
	gameObject.name = "WorkerBee"+ ++m_InstanceID;
	PickPoint();

}

function PickPoint()
{
	while(true)
	{
		if(transform.parent != null)
		{
			m_DestPoint = transform.parent.position + Vector3.up*12+ Random.onUnitSphere*12;
		}
		yield WaitForSeconds(Random.Range(0.15, 0.25));
	}
}

function Update () {



	if(transform.parent != null)
	{
		if(m_SpawnFlightTimer < m_SpawnFlightTime)
		{
			m_SpawnFlightTimer += Time.deltaTime;
			GetComponent(TrailRenderer).time = 0.2;
			transform.position = Vector3.Lerp(transform.parent.position + Vector3.up*200,transform.parent.position + Vector3.up*12,m_SpawnFlightTimer/m_SpawnFlightTime);
		}
		else
		{
			GetComponent(TrailRenderer).time = 0.5;
			transform.position += (m_DestPoint-transform.position) * Time.deltaTime * 5;
			transform.LookAt(transform.parent.position + Vector3.up*12);
		}
	}

}