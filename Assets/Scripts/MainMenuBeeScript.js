#pragma strict
var m_Pos : Vector3;
var m_WorldPos : Vector3;
var m_Timer : float = -1;


function Start () {
		
		m_Pos = transform.position;
		
}

function Update () {

	
	if(m_Timer < 0)
	{
		m_Timer = Random.Range(0.5, 5);
		m_WorldPos = Vector3(Random.Range(-30,30), Random.Range(-30,30), 0);
		
	}
	else
	{
		m_Timer -= Time.deltaTime;
	}
	m_Pos += (m_WorldPos - transform.position) * Time.deltaTime;
	transform.position = m_Pos;
	transform.position.x = Mathf.Min(Mathf.Max(transform.position.x, -25), 27) ;
	transform.position.z = -18;
	transform.position.y = Mathf.Min(Mathf.Max(m_Pos.y, -25), 27)  + (Mathf.Sin(Time.time*26)+2)*0.5;
	transform.LookAt(Vector3(0,0,0));

}