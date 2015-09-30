#pragma strict
var m_Owner:GameObject = null;
var m_HP:int = 3;
function Start () {

}

function Update () {

}


function OnBulletCollision(coll:BulletCollision)
{
	if(!Network.isServer)
		return;
	
	var bs:BulletScript = coll.bullet.GetComponent(BulletScript);
	if(bs.m_Owner != m_Owner)
	{
		m_Owner.GetComponent(UpdateScript).m_Vel = coll.bullet.GetComponent(UpdateScript).m_Vel.normalized* 50;
		if(coll.bullet.GetComponent(BulletScript).m_PowerShot)
		{
		
			m_Owner.networkView.RPC("SetShieldHP", RPCMode.All, m_Owner.GetComponent(BeeScript).m_ShieldHP - 5);
		}
		else
		{
			m_Owner.networkView.RPC("SetShieldHP", RPCMode.All, m_Owner.GetComponent(BeeScript).m_ShieldHP - 1);

		}
	}
}

//this gets called from the bee script actually in SetShieldHP
function OnHit()
{
	
}
