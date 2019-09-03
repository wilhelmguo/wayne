package models

import (
	"time"
)

const (
	TableNameServiceTemplate = "service_template"
)

type serviceTplModel struct{}

type ServiceTemplate struct {
	Id          int64    `orm:"auto" json:"id,omitempty"`
	Name        string   `orm:"size(128)" json:"name,omitempty"`
	Template    string   `orm:"type(text)" json:"template,omitempty"`
	Service     *Service `orm:"index;rel(fk);column(service_id)" json:"service,omitempty"`
	Description string   `orm:"size(512)" json:"description,omitempty"`

	CreateTime time.Time `orm:"auto_now_add;type(datetime)" json:"createTime,omitempty"`
	UpdateTime time.Time `orm:"auto_now;type(datetime)" json:"updateTime,omitempty"`
	User       string    `orm:"size(128)" json:"user,omitempty"`
	Deleted    bool      `orm:"default(false)" json:"deleted,omitempty"`

	Status    []*PublishStatus `orm:"-" json:"status,omitempty"`
	ServiceId int64            `orm:"-" json:"serviceId,omitempty"`
}

func (*ServiceTemplate) TableName() string {
	return TableNameServiceTemplate
}

func (*serviceTplModel) Add(m *ServiceTemplate) (id int64, err error) {
	m.Service = &Service{Id: m.ServiceId}
	id, err = Ormer().Insert(m)
	return
}

func (*serviceTplModel) UpdateById(m *ServiceTemplate) (err error) {
	v := ServiceTemplate{Id: m.Id}
	// ascertain id exists in the database
	if err = Ormer().Read(&v); err == nil {
		m.Service = &Service{Id: m.ServiceId}
		_, err = Ormer().Update(m)
		return err
	}
	return
}

func (*serviceTplModel) GetById(id int64) (v *ServiceTemplate, err error) {
	v = &ServiceTemplate{Id: id}

	if err = Ormer().Read(v); err == nil {
		_, err = Ormer().LoadRelated(v, "Service")
		if err == nil {
			v.ServiceId = v.Service.Id
			return v, nil
		}
	}
	return nil, err
}

func (*serviceTplModel) DeleteById(id int64, logical bool) (err error) {
	v := ServiceTemplate{Id: id}
	// ascertain id exists in the database
	if err = Ormer().Read(&v); err == nil {
		if logical {
			v.Deleted = true
			_, err = Ormer().Update(&v)
			return err
		}
		_, err = Ormer().Delete(&v)
		return err
	}
	return
}
