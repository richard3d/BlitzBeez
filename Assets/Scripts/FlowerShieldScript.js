#pragma strict
var m_Owner:GameObject = null;
function Start () {

}

function Update () {

}


function OnCollisionEnter(other : Collision)
{
	if(!Network.isServer)
		return;
	if(other.gameObject.tag == "Bullets")
	{
		if(other.gameObject.GetComponent(BulletScript).m_PowerShot)
		{
			Debug.Log("fuck");
			//hit by a powershot 
			if(m_Owner.GetComponent(FlowerDecorator) != null)
			{
				//knock us off the flower
				ServerRPC.Buffer(m_Owner.networkView, "RemoveComponent", RPCMode.All, "FlowerDecorator");
			}
			if(m_Owner.GetComponent(BeeScript).m_HP - 3 <= 0)
			{
				m_Owner.GetComponent(BeeScript).KillAndRespawn(true);
			}
			else
				m_Owner.networkView.RPC("SetHP", RPCMode.All, m_Owner.GetComponent(BeeScript).m_HP - 3);
			
		}
	}
}